# ❗[버그][건의사항] feedback UUID 컬럼 CHAR(36) vs PostgreSQL uuid 타입 불일치 500 오류

- **관련 이슈**: #218
- **커밋**: `0c9749d`
- **발생일**: 2026-04-13
- **환경**: PostgreSQL / Spring Boot 3.4.4 / Hibernate 6.6.11

---

## 개요

`GET /api/feedback/me` 호출 시 `operator does not exist: character = uuid` 에러로 HTTP 500이 반환되는 버그를 수정했다. 원인은 `V0_0_115` Flyway 마이그레이션에서 UUID 컬럼을 PostgreSQL 네이티브 `uuid` 타입이 아닌 `CHAR(36)` 문자열 타입으로 생성한 것이다. `V0_0_119` 마이그레이션으로 타입을 변환하고, 재발 방지를 위해 `CLAUDE.md`의 잘못된 예시도 함께 수정했다.

---

## 변경 사항

### Flyway 마이그레이션 (신규)

- `server/PQL-Web/src/main/resources/db/migration/V0_0_119__fix_feedback_uuid_column_types.sql`
  - `feedback` 테이블의 `feedback_uuid`, `member_uuid` 컬럼을 `CHAR(36)` → `UUID` 네이티브 타입으로 변환
  - `DO $$ BEGIN ... END $$;` PL/pgSQL 블록으로 감싸 **멱등성 보장**
  - `information_schema.columns`로 현재 타입이 `character` / `character varying`인 경우에만 `ALTER COLUMN ... TYPE UUID USING ::uuid` 실행
  - 이미 `uuid` 타입인 환경이나 컬럼이 없는 환경에서도 에러 없이 통과

### 가이드 문서 수정

- `server/CLAUDE.md`
  - Entity PK 예시에서 `@Column(columnDefinition = "CHAR(36)", ...)` 제거
  - PostgreSQL 전환 후 맞지 않는 MariaDB 잔재 패턴이었으며, 이 예시가 동일 버그 재발의 원인이었음

---

## 주요 구현 내용

### 버그 발생 메커니즘

1. `V0_0_115` SQL에서 `CHAR(36)` 타입으로 feedback 테이블 생성
2. Hibernate 6은 Java `UUID` 파라미터를 PostgreSQL `uuid` 타입으로 바인딩
3. PostgreSQL에 `character = uuid` 비교 연산자가 없어 쿼리 실패
4. `GlobalExceptionHandler`가 `InvalidDataAccessResourceUsageException`을 500으로 처리

### 안전장치 패턴

```sql
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback'
          AND column_name = 'feedback_uuid'
          AND data_type IN ('character', 'character varying')
    ) THEN
        ALTER TABLE feedback
            ALTER COLUMN feedback_uuid TYPE UUID USING feedback_uuid::uuid;
    END IF;
END $$;
```

같은 패턴으로 `member_uuid`도 동일하게 처리. 조건부 실행으로 어떤 환경에서도 멱등성 있게 동작한다.

---

## 주의사항

- 이 버그는 `V0_0_70__convert_uuid_char_to_native.sql`에서 전체 테이블 CHAR(36) → uuid 일괄 변환을 한 이후 신규 테이블 작성 시 동일 실수가 재발한 것이다
- `CLAUDE.md`의 잘못된 예시(`columnDefinition = "CHAR(36)"`)가 재발 원인이었으므로 해당 예시를 수정했다
- 신규 Flyway 마이그레이션 작성 시 PostgreSQL UUID 컬럼은 반드시 `UUID` 타입을 사용해야 한다 (`CHAR(36)` 사용 금지)
- 상세 트러블슈팅 분석은 `.report/20260413_#200_feedback_uuid_CHAR36_PostgreSQL_타입불일치_500오류.md` 참고
