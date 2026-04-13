# ❗[버그][문제등록] Oracle SQL 방언 MariaDB 호환 처리 부재로 벌크 임포트 Sandbox 실패

## 개요

SQLD 기출 문제 JSON을 벌크 임포트할 때 Oracle 전용 SQL 문법(`NVL`, `CONNECT BY`, `ROWNUM` 등)이 MariaDB Sandbox에서 실행되지 않아 정상적인 문제가 `sandboxStatus: FAIL`로 처리되는 버그를 수정했다. 1:1 치환 가능한 문법(`NVL→IFNULL`, `SYSDATE→NOW()`)은 정규식으로 자동 변환하고, 치환 후에도 남는 MariaDB 미지원 문법은 `CONCEPT_ONLY`로 자동 전환하여 Sandbox를 스킵하는 2단계 처리 구조를 도입했다. 벌크 임포트와 단일 문제 직접 등록 양쪽에 동일하게 적용했다.

## 변경 사항

### 백엔드 — Import/Export 서비스

- `server/PQL-Domain-Question/.../service/QuestionImportExportService.java`
  - `translateOracleToMariaDb(String sql)` 메서드 추가: 정규식 기반으로 `NVL(` → `IFNULL(`, `SYSDATE` → `NOW()` 치환 (대소문자 무관, word boundary 적용)
  - `detectOracleOnlySyntax(String answerSql, String schemaDdl, String schemaSampleData, String stem)` 메서드 추가: 치환 불가 Oracle 전용 키워드 감지 후 첫 번째 매칭 키워드 반환 (`CONNECT BY`, `ROWNUM`, `NVL2`, `DECODE`, `TO_DATE`, `PIVOT`, `MERGE INTO`, `.NEXTVAL` 등 23종)
  - `validateSingleItem()` 수정: EXECUTABLE 모드에서 `translateOracleToMariaDb()` → `detectOracleOnlySyntax()` 순서로 처리, 치환된 SQL로 Sandbox 실행
  - `importBatch()` 수정: 저장 시에도 치환된 SQL(`savedDdl`, `savedSample`, `savedAnswerSql`)을 DB에 반영, Oracle 전용 문법 감지 시 `CONCEPT_ONLY`로 전환하여 저장
  - `executeSandboxTest()` 시그니처 변경: `QuestionExportDto` 대신 치환된 SQL 문자열을 직접 파라미터로 받도록 변경

### 백엔드 — 단일 문제 직접 등록

- `server/PQL-Web/.../controller/admin/AdminQuestionController.java`
  - `register()` 핸들러 수정: 등록 전 `translateOracleToMariaDb()` 호출 후 치환된 SQL 저장, `detectOracleOnlySyntax()` 감지 시 `CONCEPT_ONLY` 자동 전환 및 로그 출력

## 주요 구현 내용

**2단계 처리 파이프라인:**

```
입력 SQL (Oracle 방언)
    ↓
[1단계] translateOracleToMariaDb()
    NVL(a, b)  → IFNULL(a, b)   — 인자 순서 동일, 안전
    SYSDATE    → NOW()           — 동일 의미, 안전
    ↓
[2단계] detectOracleOnlySyntax() — 치환 후 잔존 Oracle 문법 감지
    CONNECT BY, ROWNUM, NVL2, DECODE, TO_DATE, TO_CHAR,
    PIVOT, MERGE INTO, .NEXTVAL, ADD_MONTHS 등
         ↓ 감지됨                    ↓ 없음
    CONCEPT_ONLY 자동 전환      Sandbox 실행 (치환된 SQL로)
```

**치환 범위 설계 원칙:**
- `NVL2`, `DECODE`, `TO_DATE`, `TO_CHAR`는 인자 개수·순서·포맷 코드 체계가 달라 단순 문자열 치환 시 오작동 위험 → 치환 목록에서 제외, 감지 후 `CONCEPT_ONLY` 처리
- `REGEXP_REPLACE`는 MariaDB 10.0.5+에서 지원 → 감지 목록 제외
- `NVL(`과 `SYSDATE`는 치환 완료 후 감지하므로 Oracle 감지 목록에서 제거 (치환 후 false positive 방지)
- 정규식에 `\b` word boundary 적용으로 `NVL2`가 `NVL`로 잘못 치환되는 문제 방지

**DB 저장 일관성:** validate 단계와 import 단계 모두 동일한 치환 로직을 적용하여 검증에 사용된 SQL과 실제 저장되는 SQL이 일치한다.

## 주의사항

- `GROUPING SETS`는 MariaDB 10.2.2 이상에서 부분 지원하나 문법 차이가 있어 `CONCEPT_ONLY` 전환 대상으로 유지했다. 향후 MariaDB 버전 업그레이드 시 감지 목록에서 제외 검토 가능
- `FROM DUAL`은 MariaDB에서 실행 자체는 되나 일부 문법에서 차이가 있어 감지 대상으로 포함했다. 단순 `SELECT 1 FROM DUAL` 수준은 실제로 실행 가능하므로 향후 정밀화 가능
- `START WITH`는 일반 SQL에서도 사용될 수 있으나 현재 SQLD 문제 범위에서는 `CONNECT BY`와 함께 쓰이는 경우만 문제가 되므로 유지
