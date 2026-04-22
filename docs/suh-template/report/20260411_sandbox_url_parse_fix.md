# Sandbox DataSource URL 파싱 버그 수정

## 개요

`SandboxPool.createDataSource()` 및 `buildAdminDataSource()`에서 JDBC URL의 쿼리 파라미터에 포함된 `/`(슬래시)를 잘못 인식하는 버그를 수정했다. 이 버그로 인해 신규 sandbox DB가 아닌 기존 `passql_sandbox` DB에 연결되어, 벌크 질문 등록 시 `Duplicate entry for key 'PRIMARY'` 오류가 15건 이상 발생하고 있었다.

## 문제 발생 과정

### 증상
관리자 화면에서 JSON 벌크 임포트 시 대다수 문제에서 Sandbox 오류 발생:
```
DDL 적용 실패: Duplicate entry '10' for key 'PRIMARY'
```

### 원인 분석
JDBC URL 템플릿 구조:
```
jdbc:mariadb://127.0.0.1:3306/passql_sandbox?useSSL=false&characterEncoding=UTF-8&serverTimezone=Asia/Seoul
```

기존 코드가 `urlTemplate.lastIndexOf("/")` 로 DB명 경계를 찾았는데, 이 메서드는 쿼리 파라미터 `serverTimezone=Asia/Seoul` 안의 마지막 `/`를 가리켰다.

```
기존 결과 URL (깨진 상태):
jdbc:mariadb://127.0.0.1:3306/passql_sandbox?...Asia/sandbox_abc12345?useSSL=false&...
                                                    ↑ 잘못된 위치
```

MariaDB 드라이버가 이 깨진 URL을 파싱하지 못하고 기존 `passql_sandbox` DB에 연결하였고, 해당 DB에 이미 존재하는 PRIMARY KEY 데이터(DEPT_ID=10, 20)와 충돌했다.

## 변경 사항

### 버그 수정
- `PQL-Domain-Question/.../service/SandboxPool.java`
  - `createDataSource()`: `lastIndexOf("/")`를 전체 URL이 아닌 `?` 앞의 경로 부분에만 적용하도록 수정
  - `buildAdminDataSource()`: 동일한 방식으로 수정

### 디버그 로그 추가
- `PQL-Domain-Question/.../service/SandboxExecutor.java`
  - `applyDdl()`: 토큰 수 및 각 SQL 실행 단계 로그 추가 (근본 원인 추적을 위해 도입)

## 주요 구현 내용

```java
// 수정 전 — 쿼리 파라미터의 "/" 까지 포함되어 URL이 깨짐
String baseUrl = urlTemplate.substring(0, urlTemplate.lastIndexOf("/") + 1);

// 수정 후 — "?" 앞의 경로 부분에서만 DB명 경계를 찾음
int qIdx = urlTemplate.indexOf("?");
String urlWithoutParams = qIdx >= 0 ? urlTemplate.substring(0, qIdx) : urlTemplate;
String params           = qIdx >= 0 ? urlTemplate.substring(qIdx) : "";
String baseUrl          = urlWithoutParams.substring(0, urlWithoutParams.lastIndexOf("/") + 1);
String url              = baseUrl + dbName + params;
```

`createDataSource()` / `buildAdminDataSource()` 두 메서드 모두 동일한 패턴으로 수정하여 일관성을 유지했다.

## 주의사항

- **`passql_sandbox` DB 잔여 데이터**: 버그가 활성화된 동안 해당 DB에 DEPT, EMP 등의 테이블과 데이터가 누적되었을 수 있다. 서버 재시작 전 `passql_sandbox` DB의 테이블을 정리하거나, 해당 DB를 초기화하는 것을 권장한다.
- **JSON `answerSql` 오류 별도 존재**: `Unknown column 'A.ID' in 'SELECT'` 유형의 오류(3건)는 서버 버그가 아닌 JSON 데이터 자체의 컬럼 참조 오류로, 별도 수정이 필요하다.
- **`FULL OUTER JOIN` MariaDB 미지원 처리**: `detectOracleOnlySyntax()`의 Oracle 전용 문법 감지 목록에 `FULL OUTER JOIN`을 추가하여, 해당 문법이 포함된 문제는 sandbox 실행을 건너뛰고 자동으로 `CONCEPT_ONLY`로 전환되도록 처리했다.
