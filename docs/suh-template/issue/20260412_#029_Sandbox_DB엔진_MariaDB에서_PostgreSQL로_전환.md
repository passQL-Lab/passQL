# ⚙️[기능개선][Sandbox] Sandbox DB 엔진 MariaDB → PostgreSQL 전환

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- Sandbox 실행 엔진으로 MariaDB를 사용 중이나 `FULL OUTER JOIN` 등 표준 SQL 문법을 지원하지 않아 선택지 생성 시 `CHOICE_SET_VALIDATION_NO_CORRECT` 오류가 반복 발생
- SQLD 시험 범위 문법(`FULL OUTER JOIN`, `INTERSECT`, `EXCEPT` 등) 을 포함한 선택지를 Sandbox에서 실행할 수 없어 해당 유형의 문제 생성이 불가능
- Oracle 문법 호환 처리(`detectOracleOnlySyntax`)에서 MariaDB 미지원 항목으로 `FULL OUTER JOIN`을 감지해 `CONCEPT_ONLY` 강제 전환하는 우회 로직이 존재했으나 근본 해결이 필요

🛠️해결 방안 / 제안 기능
---

- Sandbox DB 엔진을 MariaDB → PostgreSQL로 전환
- PostgreSQL은 `FULL OUTER JOIN`, `INTERSECT`, `EXCEPT`, `GROUPING SETS`, `WINDOW FUNCTION` 등 표준 SQL 전체 지원
- Oracle 전용 문법(`CONNECT BY`, `ROWNUM`, `DECODE`, `PIVOT` 등)은 PostgreSQL도 미지원 → 기존 감지 로직 유지, `FULL OUTER JOIN`만 감지 목록에서 제거

⚙️작업 내용
---

- `PQL-Common/build.gradle`: `mariadb-java-client` + `flyway-mysql` → `postgresql` + `flyway-database-postgresql`
- `application-prod.yml` / `application-dev.yml`: datasource 및 sandbox URL/드라이버 PostgreSQL로 변경
- `SandboxPool.java`: 드라이버 변경, `CREATE/DROP DATABASE` PG 문법 적용(`autoCommit(true)` 필수), admin DB를 `mysql` → `postgres`로 변경
- `SandboxDataSourceConfig.java`: 드라이버 변경
- `Dialect.java`: `POSTGRESQL` enum 값 추가
- `QuestionGenerateService.java`: `Dialect.MARIADB` → `Dialect.POSTGRESQL`
- `QuestionImportExportService.java`: `translateOracleToMariaDb` → `translateOracleToPostgres` (NVL → `COALESCE`), `detectOracleOnlySyntax` 감지 목록에서 `FULL OUTER JOIN` 제거
- Flyway 마이그레이션 전체 PG 호환 변환: `TINYINT(1)` → `BOOLEAN`, `DATETIME(6)` → `TIMESTAMP(6)`, `AUTO_INCREMENT` → `GENERATED ALWAYS AS IDENTITY`, `JSON` → `JSONB`, `UUID()` → `gen_random_uuid()`, `NOW(6)` → `NOW()`, 인라인 INDEX → `CREATE INDEX IF NOT EXISTS`, `ON DUPLICATE KEY UPDATE` → `ON CONFLICT DO UPDATE`, MariaDB `DELETE JOIN` → PG `DELETE ... USING` 문법
- `V0_0_69__add_sandbox_sql_max_length_setting.sql`: `sandbox.sql_max_length` 설정값 Flyway 시드 추가
- PostgreSQL 서버 초기 설정: `passql_app` DB 생성, `sqld_runner` 유저 생성 및 `CREATEDB` 권한 부여

🙋‍♂️담당자
---

- 백엔드:
- 프론트엔드:
- 디자인:
