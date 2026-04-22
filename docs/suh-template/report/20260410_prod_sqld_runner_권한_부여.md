# prod 환경 샌드박스 DB 접속 오류 해결

## 개요

prod 서버에서 샌드박스 기능 실행 시 두 단계에 걸쳐 오류가 발생했다. 1차로 `sqld_runner` 유저 미존재로 인한 `Access denied`, 2차로 `url-template`의 `{id}` 플레이스홀더가 치환되지 않아 발생한 `Unknown database 'sqld_q{id}'`. 유저 생성 및 권한 부여, yml 설정 수정으로 해결했다.

---

## 처리 내용

### 1차 오류: sqld_runner 유저 미존재

**에러**: `Access denied for user 'sqld_runner'@'172.30.1.254' (using password: YES)`

- `application-prod.yml`의 sandbox datasource가 NAS MariaDB(`suh-project.synology.me:3306`)를 가리키고 있으나, `sqld_runner` 유저 자체가 존재하지 않았음
- SSH 비밀번호 인증이 시놀로지 기본 설정상 비활성화되어 있어, MariaDB 3306 포트에 `kimchi` 계정으로 직접 접속하여 처리

**실행한 SQL**

```sql
CREATE USER IF NOT EXISTS 'sqld_runner'@'%' IDENTIFIED BY 'Kimchi123@';
GRANT ALL PRIVILEGES ON `sandbox_%`.* TO 'sqld_runner'@'%';
GRANT ALL PRIVILEGES ON `sqld_q%`.* TO 'sqld_runner'@'%';
GRANT SELECT ON mysql.* TO 'sqld_runner'@'%';
FLUSH PRIVILEGES;
```

---

### 2차 오류: url-template {id} 플레이스홀더 미치환

**에러**: `Unknown database 'sqld_q{id}'`

- 1차 해결 후 재시도하자 새 에러 발생
- `application-prod.yml`의 `url-template`이 `sqld_q{id}` 형태였는데, `SandboxPool.java`는 `urlTemplate`에서 마지막 `/` 이후를 동적 DB명으로 교체하는 구조
- `{id}` 플레이스홀더가 코드 내에서 치환되지 않아 `sqld_q{id}`가 그대로 DB명으로 사용됨
- dev 환경 트러블슈팅 기록(케이스 3번)과 동일한 문제

**코드 흐름**

```java
// createDataSource(dbName) — urlTemplate에서 마지막 "/" 이후를 dbName으로 교체
String baseUrl = urlTemplate.substring(0, urlTemplate.lastIndexOf("/") + 1);
String url = baseUrl + dbName + params;
// → 정상이면 "jdbc:mariadb://host:3306/sandbox_xxxxxxxx?..."
// → {id}가 포함된 경로라면 파싱 자체는 되지만 admin 접속 URL에 sqld_q{id}가 그대로 남음
```

**변경 사항**

`application-prod.yml`:
```yaml
# Before
url-template: jdbc:mariadb://suh-project.synology.me:3306/sqld_q{id}?useSSL=false&...

# After
url-template: jdbc:mariadb://suh-project.synology.me:3306/passql_sandbox?useSSL=false&...
```

추가로 NAS에 `passql_sandbox` DB 생성 및 권한 부여:

```sql
CREATE DATABASE IF NOT EXISTS passql_sandbox;
GRANT ALL PRIVILEGES ON `passql_sandbox`.* TO 'sqld_runner'@'%';
FLUSH PRIVILEGES;
```

---

## 최종 권한 상태

| 권한 | 대상 |
|------|------|
| ALL PRIVILEGES | `sandbox_%.*` |
| ALL PRIVILEGES | `passql_sandbox.*` |
| SELECT | `mysql.*` |

---

## 주의사항

- `sqld_runner@'%'`는 모든 IP에서 접속 허용 — 운영 안정화 후 앱 서버 IP로 제한 권장
- `application-prod.yml` 변경사항은 재배포(빌드+재시작) 후 반영됨
