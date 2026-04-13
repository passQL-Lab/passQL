# 건의사항 API 설계 스펙

- **이슈**: passQL-Lab/passQL#200
- **작성일**: 2026-04-13
- **담당**: Cassiiopeia (BE)

---

## 1. 개요

설정 화면에 구현된 건의사항 UI(#198)를 실제로 동작시키기 위한 백엔드 API 구현.  
현재 프론트는 404 응답 시 빈 목록으로 fallback 처리 중이며, 이 API 구현으로 실제 제출·조회가 가능해진다.

---

## 2. 엔드포인트

| Method | Path | 헤더 | 설명 |
|--------|------|------|------|
| POST | `/feedback` | `X-Member-UUID: {uuid}` | 건의사항 제출 |
| GET | `/feedback/me` | `X-Member-UUID: {uuid}` | 내 건의사항 목록 조회 |

회원 식별은 `X-Member-UUID` 헤더로 통일한다. 나중에 JWT 교체 시 헤더 레벨에서만 교체하면 된다.

---

## 3. 모듈 배치

`Feedback`은 앱 운영 피드백 성격이므로 `PQL-Domain-Meta` 모듈에 추가한다.

```
PQL-Domain-Meta/
└── com/passql/meta/
    ├── constant/FeedbackStatus.java
    ├── entity/Feedback.java
    ├── repository/FeedbackRepository.java
    ├── service/FeedbackService.java
    └── dto/
        ├── FeedbackSubmitRequest.java
        ├── FeedbackSubmitResponse.java
        └── FeedbackListResponse.java

PQL-Web/
└── com/passql/web/controller/
    ├── FeedbackController.java
    └── FeedbackControllerDocs.java
```

---

## 4. 엔티티 설계

### Feedback

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| feedbackUuid | UUID | PK, not null | 자동 생성 UUID |
| memberUuid | UUID | not null | 제출한 회원 UUID (FK 없이 느슨한 결합) |
| content | String | not null, length=500 | 건의사항 내용 |
| status | FeedbackStatus | not null | 기본값 PENDING |
| createdAt | LocalDateTime | BaseEntity | 생성 시각 |
| updatedAt | LocalDateTime | BaseEntity | 수정 시각 |

인덱스:
- `idx_feedback_member_uuid` — `member_uuid` (회원별 목록 조회 최적화)
- `idx_feedback_created_at` — `created_at` (정렬 최적화)

### FeedbackStatus enum

| 값 | 화면 표시 | 의미 |
|----|----------|------|
| PENDING | 대기 (노란 pill) | 접수됨, 미확인 |
| REVIEWED | 확인됨 (인디고 pill) | 팀에서 확인함 |
| APPLIED | 반영됨 (초록 pill) | 반영 완료 |

status 변경은 관리자 측에서만 수행. 프론트는 읽기 전용.

---

## 5. API 상세

### POST /feedback — 건의사항 제출

**Request**
```
Headers: X-Member-UUID: {uuid}
Body: { "content": "다크모드를 지원해 주세요." }
```

**Validation**
- `content`: 필수, 1자 이상 500자 이하

**Response 200 OK**
```json
{
  "feedbackUuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "createdAt": "2026-04-13T07:00:00Z"
}
```

**에러**

| 코드 | 상황 |
|------|------|
| 400 | content가 비어 있거나 500자 초과 |
| 401 | X-Member-UUID 없음 또는 유효하지 않음 |

---

### GET /feedback/me — 내 건의사항 목록

**Request**
```
Headers: X-Member-UUID: {uuid}
```

**Response 200 OK**
```json
{
  "items": [
    {
      "feedbackUuid": "550e8400-e29b-41d4-a716-446655440000",
      "content": "다크모드를 지원해 주세요.",
      "status": "PENDING",
      "createdAt": "2026-04-13T07:00:00Z"
    }
  ]
}
```

- 건의사항이 없으면 `200 + { "items": [] }` 반환 (404 금지)
- 정렬: `createdAt` 내림차순 (최신 순)

**에러**

| 코드 | 상황 |
|------|------|
| 401 | X-Member-UUID 없음 또는 유효하지 않음 |

---

## 6. ErrorCode 추가

`PQL-Common/exception/constant/ErrorCode.java`에 Feedback 카테고리 추가:

```java
// Feedback
FEEDBACK_CONTENT_EMPTY(HttpStatus.BAD_REQUEST, "건의사항 내용을 입력해 주세요."),
FEEDBACK_CONTENT_TOO_LONG(HttpStatus.BAD_REQUEST, "건의사항은 500자 이하로 입력해 주세요."),
```

---

## 7. Flyway 마이그레이션

파일명: `V0_0_115__add_feedback_table.sql`

```sql
CREATE TABLE IF NOT EXISTS feedback (
    feedback_uuid  CHAR(36)     NOT NULL,
    member_uuid    CHAR(36)     NOT NULL,
    content        VARCHAR(500) NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at     DATETIME(6)  NULL,
    updated_at     DATETIME(6)  NULL,
    created_by     VARCHAR(255) NULL,
    updated_by     VARCHAR(255) NULL,
    PRIMARY KEY (feedback_uuid)
);

CREATE INDEX IF NOT EXISTS idx_feedback_member_uuid ON feedback (member_uuid);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at  ON feedback (created_at);
```

---

## 8. 구현 체크리스트

- [ ] `FeedbackStatus` enum (`constant/`)
- [ ] `Feedback` 엔티티 (`entity/`)
- [ ] `FeedbackRepository` (`repository/`)
- [ ] `FeedbackService` — `submit()`, `getMyFeedbacks()` (`service/`)
- [ ] `FeedbackSubmitRequest`, `FeedbackSubmitResponse`, `FeedbackListResponse` (`dto/`)
- [ ] `FeedbackController` + `FeedbackControllerDocs` (`PQL-Web/controller/`)
- [ ] `ErrorCode`에 `FEEDBACK_CONTENT_EMPTY`, `FEEDBACK_CONTENT_TOO_LONG` 추가
- [ ] `V0_0_115__add_feedback_table.sql` 마이그레이션 파일 추가
