# ❗[버그][DB] Flyway 마이그레이션 V0_0_160 — MySQL 전용 문법을 PostgreSQL에 사용해 서버 기동 불가

## 개요

닉네임 변경 이력 컬럼을 추가하는 마이그레이션 파일(`V0_0_160__add_nickname_changed_at_to_member.sql`)에 MySQL 전용 문법(`DATETIME(6)`, 인라인 `COMMENT`)을 사용한 결과, PostgreSQL 14.15 환경에서 SQL 구문 오류(`42601`)가 발생했다. Flyway가 마이그레이션 도중 실패·롤백하면서 Spring Boot 컨텍스트 초기화가 중단됐고 서버 전체가 기동 불가 상태가 됐다. `DATETIME(6)` → `TIMESTAMP(6)`, 인라인 `COMMENT` → `COMMENT ON COLUMN` 별도 구문으로 수정하여 해결했다.

## 증상

- Docker 컨테이너 `passql-back` 기동 즉시 종료
- `org.postgresql.util.PSQLException: ERROR: syntax error at or near "COMMENT"` (SQL State 42601)
- Flyway가 V0_0_155 → V0_0_160 마이그레이션 실패 후 롤백
- Spring Boot `entityManagerFactory` 빈 생성 실패 → 서비스 전체 다운

## 원인 분석

### 근본 원인

**개발 환경과 운영 환경의 DB 엔진 불일치 + 작성자의 MySQL 문법 혼용**

| 항목 | MySQL 문법 (잘못 사용) | PostgreSQL 문법 (올바른 문법) |
|------|----------------------|----------------------------|
| 날짜시간 타입 | `DATETIME(6)` | `TIMESTAMP(6)` |
| 컬럼 주석 | `컬럼 정의 끝에 COMMENT '...'` | `COMMENT ON COLUMN 테이블.컬럼 IS '...'` (별도 구문) |

### 발생 메커니즘

1. 마이그레이션 SQL 작성 시 MySQL 문법인 `DATETIME(6)` + 인라인 `COMMENT`를 사용
2. Flyway가 운영 서버의 PostgreSQL 14.15에 해당 SQL 실행 시도
3. PostgreSQL이 `COMMENT` 키워드 위치에서 구문 오류(position 86) 발생
4. Flyway가 트랜잭션 롤백 후 `FlywayMigrateException` 발생
5. Spring Boot `flywayInitializer` 빈 초기화 실패 → `entityManagerFactory` 생성 불가 → 서버 기동 중단

### 왜 로컬에서 발견 못했는가

- 로컬 개발 환경이 MySQL을 사용하거나, Flyway 마이그레이션 없이 `hibernate.ddl-auto=create/update`로만 동작하는 경우 해당 SQL이 실행되지 않아 사전에 발견 불가
- PostgreSQL 운영 서버에 배포되기 전까지 오류가 드러나지 않는 구조적 문제

## 변경 사항

### 수정 파일

`server/PQL-Web/src/main/resources/db/migration/V0_0_160__add_nickname_changed_at_to_member.sql`

**수정 전:**
```sql
ALTER TABLE member
  ADD COLUMN IF NOT EXISTS nickname_changed_at DATETIME(6) NULL
  COMMENT '마지막 닉네임 직접 변경 시각 (NULL이면 자동생성 상태, 변경 후 3일 쿨다운)';
```

**수정 후:**
```sql
ALTER TABLE member
  ADD COLUMN IF NOT EXISTS nickname_changed_at TIMESTAMP(6) NULL;

COMMENT ON COLUMN member.nickname_changed_at IS '마지막 닉네임 직접 변경 시각 (NULL이면 자동생성 상태, 변경 후 3일 쿨다운)';
```

## 재발 방지

### 필수 규칙 추가 (이후 마이그레이션 파일 작성 시)

| 항목 | MySQL (금지) | PostgreSQL (사용) |
|------|------------|-----------------|
| 날짜시간 타입 | `DATETIME`, `DATETIME(6)` | `TIMESTAMP`, `TIMESTAMP(6)` |
| 컬럼 주석 | `COMMENT '...'` (인라인) | `COMMENT ON COLUMN t.c IS '...'` (별도 구문) |
| 자동증가 PK | `AUTO_INCREMENT` | `SERIAL` 또는 `GENERATED ALWAYS AS IDENTITY` (본 프로젝트는 UUID PK이므로 해당 없음) |
| 문자열 타입 | `VARCHAR` 동일하나 길이 제한 없는 경우 | `TEXT` 사용 권장 |
| boolean | `TINYINT(1)` | `BOOLEAN` |

### 체크리스트에 추가 권장

- [ ] 마이그레이션 SQL에 `DATETIME` 사용 여부 확인 → `TIMESTAMP`로 교체
- [ ] 마이그레이션 SQL에 인라인 `COMMENT '...'` 사용 여부 확인 → `COMMENT ON COLUMN` 분리
- [ ] SQL을 psql 또는 PostgreSQL 호환 환경에서 사전 실행 검증

## 관련 정보

- **이슈**: #287 닉네임 직접 변경 기능 구현
- **마이그레이션 버전**: V0_0_160
- **DB 엔진**: PostgreSQL 14.15 (운영), `jdbc:postgresql://suh-project.synology.me:5430/passql_app`
- **발생 시각**: 2026-04-25 18:08:44 KST
- **SQL State**: 42601 (syntax_error)
