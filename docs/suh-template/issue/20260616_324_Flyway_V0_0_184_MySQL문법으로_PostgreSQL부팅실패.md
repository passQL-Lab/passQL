🗒️ 설명
---

Flyway 마이그레이션 파일 `V0_0_184__daily_set.sql`이 **MySQL 문법으로 작성**되어, PostgreSQL 환경에서 실행될 때 문법 오류가 발생합니다. 이로 인해 Spring Boot 부팅이 `flywayInitializer` 빈 생성 단계에서 실패하여 애플리케이션이 기동되지 않습니다.

본 프로젝트의 운영 DB는 PostgreSQL이며, 기존 마이그레이션은 모두 PostgreSQL 방언으로 작성되어 있으나 해당 파일만 MySQL 방언으로 작성되어 있었습니다.

🔄 재현 방법
---

1. 로컬/dev 프로필로 Spring Boot 애플리케이션 기동
2. Flyway가 스키마를 `0.0.184 - daily set` 버전으로 마이그레이션 시도
3. PostgreSQL이 `ALTER TABLE ... DROP INDEX IF EXISTS` 구문 파싱 중 오류 반환
4. 부팅 실패 — 애플리케이션 컨텍스트 초기화 중단

📸 참고 자료
---

```
o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "0.0.184 - daily set"
ERROR o.f.core.internal.command.DbMigrate : Migration of schema "public" to version "0.0.184 - daily set" failed!
Caused by: org.postgresql.util.PSQLException: ERROR: syntax error at or near "IF"
  Position: 103
Location : db/migration/V0_0_184__daily_set.sql
```

문제가 된 MySQL 방언 구문들:

- `ALTER TABLE ... DROP INDEX IF EXISTS` — PostgreSQL은 `ALTER TABLE`에서 인덱스를 못 지움
- `ADD COLUMN ... AFTER xxx` — PostgreSQL은 `AFTER` 미지원
- `ADD CONSTRAINT IF NOT EXISTS` — PostgreSQL은 제약조건에 `IF NOT EXISTS` 미지원
- `DATETIME(6)` — PostgreSQL은 `TIMESTAMP(6)`
- `CHAR(36)` UUID — 본 프로젝트는 V0_0_70에서 네이티브 `UUID`로 통일됨
- 테이블 내부 `UNIQUE KEY` / `INDEX` 정의 — PostgreSQL은 별도 `CONSTRAINT` / `CREATE INDEX` 필요

✅ 예상 동작
---

- Spring Boot가 정상 기동되고 Flyway가 `0.0.184` 마이그레이션을 오류 없이 적용해야 함
- `daily_challenge`의 날짜 단독 유니크 제약이 `(challenge_date, sort_order)` 복합 유니크로 교체되어야 함
- `daily_set_submission` 테이블이 정상 생성되어야 함

⚙️ 환경 정보
---

- **OS**: macOS
- **DB**: PostgreSQL 18.1
- **Framework**: Spring Boot 3.4.4 / Flyway 10.20.1

🛠️ 해결 방안
---

`V0_0_184__daily_set.sql`을 PostgreSQL 방언으로 전면 수정:

- `DROP INDEX IF EXISTS` → `DROP CONSTRAINT IF EXISTS` (UNIQUE 제약이므로)
- `ADD COLUMN ... AFTER` → `AFTER` 절 제거
- `ADD CONSTRAINT IF NOT EXISTS` → `DO $$ ... pg_constraint 존재 확인 ... $$` 멱등 블록
- `DATETIME(6)` → `TIMESTAMP(6)`
- `CHAR(36)` → `UUID` 네이티브
- 테이블 내 `UNIQUE KEY`/`INDEX` → `CONSTRAINT ... UNIQUE` + 별도 `CREATE INDEX`

수정 후 로컬 PostgreSQL에 트랜잭션 dry-run(BEGIN → 실행 → ROLLBACK)으로 전 문장 통과를 검증함.

🙋‍♂️ 담당자
---

- **백엔드**: SUHSAECHAN
