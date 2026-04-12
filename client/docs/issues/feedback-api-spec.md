# ⚙️ [기능추가][설정] 건의사항 API 구현 요청

📝 현재 문제점
---

- 설정 화면에 건의사항 제출 및 조회 UI가 구현되어 있으나(#198), 백엔드 API가 미구현 상태
- 현재 프론트는 404 응답 시 빈 목록으로 fallback 처리 중 (임시)
- 백엔드 API 없이는 실제 건의사항 제출·확인 불가

🛠️ 해결 방안 / 제안 기능
---

- `POST /feedback` — 건의사항 제출
- `GET /feedback/me` — 내 건의사항 목록 조회

⚙️ 작업 내용
---

### POST /feedback — 건의사항 제출

**Request**

| | |
|---|---|
| Method | `POST` |
| Path | `/feedback` |
| Headers | `Content-Type: application/json`, `X-Member-UUID: {uuid}` |

```json
{
  "content": "다크모드를 지원해 주세요."
}
```

| 필드 | 타입 | 필수 | 제약 |
|------|------|:----:|------|
| `content` | string | O | 1자 이상 500자 이하 |

**Response `200 OK`**

```json
{
  "feedbackUuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "createdAt": "2026-04-13T07:00:00Z"
}
```

| 에러 코드 | 상황 |
|-----------|------|
| `400` | content가 비어 있거나 500자 초과 |
| `401` | X-Member-UUID 없음 또는 유효하지 않음 |

---

### GET /feedback/me — 내 건의사항 목록 조회

**Request**

| | |
|---|---|
| Method | `GET` |
| Path | `/feedback/me` |
| Headers | `X-Member-UUID: {uuid}` |

**Response `200 OK`**

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

> **⚠️ 중요:** 건의사항이 없을 경우 `404`가 아닌 `200 + { "items": [] }` 반환 필수

정렬: `createdAt` 내림차순 (최신 순)

| 에러 코드 | 상황 |
|-----------|------|
| `401` | X-Member-UUID 없음 또는 유효하지 않음 |

---

### FeedbackStatus 정의

| 값 | 화면 표시 | 의미 |
|----|-----------|------|
| `PENDING` | 대기 (노란 pill) | 접수됨, 미확인 |
| `REVIEWED` | 확인됨 (인디고 pill) | 팀에서 확인함 |
| `APPLIED` | 반영됨 (초록 pill) | 반영 완료 |

status 변경은 관리자 측에서만 수행. 프론트는 읽기 전용.

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
