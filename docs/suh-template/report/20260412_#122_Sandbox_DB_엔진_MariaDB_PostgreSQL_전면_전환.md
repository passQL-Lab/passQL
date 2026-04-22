# [기능개선][Sandbox] Sandbox DB 엔진 MariaDB → PostgreSQL 전면 전환

## 개요

Sandbox 실행 엔진을 MariaDB에서 PostgreSQL로 전면 전환하였다. FULL OUTER JOIN, INTERSECT, EXCEPT 등 SQLD 시험 범위 표준 SQL 문법이 MariaDB에서 지원되지 않아 선택지 생성 시 `CHOICE_SET_VALIDATION_NO_CORRECT` 오류가 반복 발생하던 근본 원인을 해소하였다. 전환 과정에서 Entity UUID 타입 정합성 및 JSONB 컬럼 바인딩 이슈도 함께 수정하였다.

## 변경 사항

### 의존성

- `server/PQL-Common/build.gradle`: `mariadb-java-client` + `flyway-mysql` → `org.postgresql:postgresql` + `org.flywaydb:flyway-database-postgresql` 교체

### 핵심 서비스

- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxPool.java`
  - 드라이버 `com.mysql.cj.jdbc.Driver` → `org.postgresql.Driver`
  - `CREATE DATABASE` / `DROP DATABASE` 를 autoCommit=true 환경에서 실행 (PostgreSQL 필수 조건)
  - admin 연결 기본 DB `mysql` → `postgres`로 변경
- `server/PQL-Web/src/main/java/com/passql/web/config/SandboxDataSourceConfig.java`
  - 드라이버 PostgreSQL로 교체

### 도메인 로직

- `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/Dialect.java`
  - `POSTGRESQL` enum 값 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionGenerateService.java`
  - 문제 생성 시 `Dialect.MARIADB` → `Dialect.POSTGRESQL` 기본값 적용
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionImportExportService.java`
  - `translateOracleToMariaDb()` → `translateOracleToPostgres()` 전면 교체 (NVL → COALESCE, SYSDATE → NOW())
  - `detectOracleOnlySyntax()` 감지 목록에서 FULL OUTER JOIN 제거 (PG 지원 문법이므로 CONCEPT_ONLY 강제 전환 불필요)
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java`
  - `translateOracleToMariaDb()` 호출 3곳 → `translateOracleToPostgres()` 로 수정

### Entity — UUID 타입 정합성

Hibernate 6의 `UUIDJdbcType`은 PostgreSQL native `uuid` 타입을 기대하므로, MariaDB용 `@Column(columnDefinition = "CHAR(36)")` 선언을 전체 Entity에서 제거하였다.

- `server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java`
- `server/PQL-Domain-Member/src/main/java/com/passql/member/entity/MemberSuspendHistory.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/AppSetting.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/ConceptDoc.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/ConceptTag.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/ExamSchedule.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/Subtopic.java`
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/Topic.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailyChallenge.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoice.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSet.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSetItem.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionConceptTag.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuizSession.java`
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/entity/ExecutionLog.java`
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/entity/Submission.java`

### Entity — JSONB 컬럼 바인딩

Hibernate 6 + PostgreSQL에서 `String` 필드를 `jsonb` 컬럼에 바인딩할 때 `varchar` 타입으로 전달하여 `column is of type jsonb but expression is of type character varying` 오류가 발생. `@JdbcTypeCode(SqlTypes.JSON)` 추가로 해소.

- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/PromptTemplate.java` — `extraParamsJson`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java` — `extraMetaJson`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSet.java` — `rawResponseJson`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSetItem.java` — `sandboxExecutionJson`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuizSession.java` — `questionOrderJson`

### Flyway 마이그레이션

**기존 마이그레이션 PG 호환 변환** (V0_0_11 ~ V0_0_64):
- `TINYINT(1)` → `BOOLEAN`
- `DATETIME(6)` → `TIMESTAMP(6)`
- `AUTO_INCREMENT` → `GENERATED ALWAYS AS IDENTITY`
- `JSON` → `JSONB`
- `UUID()` → `gen_random_uuid()`
- `NOW(6)` → `NOW()`
- MariaDB 인라인 INDEX → `CREATE INDEX IF NOT EXISTS`
- `ON DUPLICATE KEY UPDATE` → `ON CONFLICT DO UPDATE`
- MariaDB DELETE JOIN → `DELETE ... USING` (PG 문법)
- `CHAR(36)` / `VARCHAR(36)` UUID 컬럼 → `UUID` 네이티브 타입
- `VARUUID` 오타 (`V0_0_12`) → `UUID` 수정

**신규 마이그레이션**:
- `server/PQL-Web/src/main/resources/db/migration/V0_0_70__convert_uuid_char_to_native.sql`
  - 기존 DB에 CHAR(36)으로 생성된 UUID 컬럼 40개를 native `uuid` 타입으로 일괄 변환
  - Phase 1: FK 제약 17개 DROP → Phase 2: `ALTER COLUMN ... TYPE uuid USING col::uuid` → Phase 3: FK 재등록

## 주요 구현 내용

**PostgreSQL CREATE/DROP DATABASE 주의사항**: PostgreSQL은 DDL 트랜잭션 내부에서 `CREATE DATABASE` / `DROP DATABASE` 실행을 허용하지 않는다. `SandboxPool`에서 `conn.setAutoCommit(true)` 를 명시적으로 설정한 뒤 실행하도록 수정하였다.

**UUID 타입 마이그레이션 전략**: Hibernate 6의 `UUIDJdbcType`은 PostgreSQL native `uuid` 타입과만 호환된다. `CHAR(36)` 컬럼이 남아있는 기존 DB를 위해 `V0_0_70` 마이그레이션에서 FK 제약을 일시 해제하고 `USING col::uuid` 캐스트로 일괄 변환한다.

**JSONB 바인딩**: `@Column(columnDefinition = "JSONB")`는 DDL 힌트일 뿐 JDBC 바인딩 타입에는 영향을 주지 않는다. Hibernate 6에서 `String` → `jsonb` 바인딩을 위해 반드시 `@JdbcTypeCode(SqlTypes.JSON)` 를 함께 선언해야 한다.

## 주의사항

- 기존 마이그레이션 파일(V0_0_11 ~ V0_0_64)을 직접 수정하였으므로, **이미 해당 버전이 적용된 DB가 있다면 Flyway 체크섬 검증 오류가 발생한다.** 이 경우 DB를 초기화하거나 `flyway repair`를 실행해야 한다.
- `V0_0_70`은 기존 DB 보유 시에만 실질적 변환이 이루어지며, 신규 DB에서는 no-op으로 안전하게 통과된다.
- `sqld_runner` PostgreSQL 유저에 `CREATEDB` 권한이 필요하다 (Sandbox DB 생성 주체).
