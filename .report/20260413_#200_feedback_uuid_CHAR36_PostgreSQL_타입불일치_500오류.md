# feedback 테이블 CHAR(36) vs UUID 타입 불일치로 인한 500 오류

- **관련 이슈**: #200 (건의사항 API 구현)
- **발생일**: 2026-04-13
- **환경**: PostgreSQL, Spring Boot 3.4.4 / Hibernate 6.6.11

---

## 문제 요약

`GET /api/feedback/me` 호출 시 500 응답 반환 | **타입**: Spring Boot / PostgreSQL | **환경**: 프로덕션 배포 직후

---

## 증상

```
HTTP 500 — {"errorCode":"INTERNAL_SERVER_ERROR","message":"서버 내부 오류가 발생했습니다"}
```

```
ERROR: operator does not exist: character = uuid
Hint: No operator matches the given name and argument types.
      You might need to add explicit type casts.
Position: 174
```

실행된 쿼리:
```sql
SELECT ... FROM feedback f1_0 WHERE f1_0.member_uuid=? ORDER BY f1_0.created_at DESC
```

---

## 원인 분석

### 근본 원인

`V0_0_115__add_feedback_table.sql` Flyway 마이그레이션에서 UUID 컬럼을 **PostgreSQL 네이티브 `uuid` 타입이 아닌 `CHAR(36)` 문자열 타입**으로 생성했다.

```sql
-- 문제의 원인 코드 (V0_0_115)
CREATE TABLE IF NOT EXISTS feedback (
    feedback_uuid CHAR(36) NOT NULL,   -- ❌ CHAR(36)
    member_uuid   CHAR(36) NOT NULL,   -- ❌ CHAR(36)
    ...
);
```

### 발생 메커니즘

1. Hibernate 6은 Java `UUID` 타입 파라미터를 **PostgreSQL `uuid` 타입**으로 바인딩한다.
2. DB의 `member_uuid` 컬럼은 `CHAR(36)` (문자열 타입).
3. PostgreSQL은 `character = uuid` 비교 연산자를 제공하지 않으므로 쿼리 실행 실패.
4. `GlobalExceptionHandler`가 `InvalidDataAccessResourceUsageException`을 500으로 처리.

### 왜 이 실수가 반복됐나

프로젝트는 `V0_0_70__convert_uuid_char_to_native.sql`에서 **기존의 모든 테이블을 CHAR(36) → uuid로 일괄 변환**한 이력이 있다. 이 변환이 필요했던 이유는 초기 MariaDB 기준으로 설계된 `CHAR(36)` 패턴이 PostgreSQL 마이그레이션 후 Hibernate 6과 충돌했기 때문이다.

그러나 이번 `feedback` 테이블 신규 작성 시 동일한 `CHAR(36)` 패턴이 재사용되어 같은 문제가 재발했다.

### CLAUDE.md와의 괴리

`CLAUDE.md`의 Entity 작성 규칙 예시:
```java
@Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
private UUID memberUuid;
```

이 예시는 **MariaDB 시절 잔재 코드**로, 프로젝트가 PostgreSQL로 전환된 이후에는 맞지 않는 패턴이다. 실제 다른 엔티티들은 `columnDefinition` 없이 작성되어 있고, DB에서는 Hibernate가 `uuid` 네이티브 타입으로 DDL을 생성한다. Flyway SQL도 `uuid` 타입으로 일관되게 작성해야 한다.

---

## 해결 방법

### Quick Fix (이미 적용됨)

프로덕션 DB에 `V0_0_119` 마이그레이션으로 타입 변환:

```sql
-- V0_0_119__fix_feedback_uuid_column_types.sql
ALTER TABLE feedback
    ALTER COLUMN feedback_uuid TYPE UUID USING feedback_uuid::uuid,
    ALTER COLUMN member_uuid   TYPE UUID USING member_uuid::uuid;
```

배포 후 Flyway 자동 적용으로 즉시 해결된다.

### Root Fix (재발 방지)

신규 Flyway 마이그레이션 파일 작성 시 UUID 컬럼은 반드시 `UUID` 타입을 사용한다.

```sql
-- ❌ 잘못된 패턴 (MariaDB 잔재)
feedback_uuid CHAR(36) NOT NULL,
member_uuid   CHAR(36) NOT NULL,

-- ✅ 올바른 패턴 (PostgreSQL)
feedback_uuid UUID NOT NULL,
member_uuid   UUID NOT NULL,
```

---

## 검증

1. `V0_0_119` 마이그레이션 배포 후 서버 재시작
2. `GET /api/feedback/me` 호출 — 200 응답 확인
3. `POST /api/feedback` 호출 후 재조회 — 정상 데이터 반환 확인

---

## 재발 방지

### CLAUDE.md 업데이트 필요

`CLAUDE.md`의 Entity PK 예시에서 `columnDefinition = "CHAR(36)"` 제거:

```java
// 현재 CLAUDE.md 예시 (잘못됨 — MariaDB 잔재)
@Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)

// 수정 후 (실제 프로젝트 패턴과 일치)
@Column(updatable = false, nullable = false)
```

### Flyway SQL 작성 규칙 추가

`CLAUDE.md` DB 스키마 관리 규칙에 명시:
> PostgreSQL 환경에서 UUID 컬럼은 반드시 `UUID` 타입을 사용한다. `CHAR(36)` 사용 금지.

### 선례

동일한 문제가 과거에도 발생한 바 있음:
- `V0_0_70__convert_uuid_char_to_native.sql` — 전체 테이블 CHAR(36) → uuid 일괄 변환 (2026-04)
- `V0_0_119__fix_feedback_uuid_column_types.sql` — feedback 테이블 CHAR(36) → uuid 변환 (2026-04-13)
