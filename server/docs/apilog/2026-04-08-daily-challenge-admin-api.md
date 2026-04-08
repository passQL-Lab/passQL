# 2026-04-08 Daily Challenge 어드민 API 추가

## 추가된 엔드포인트

### GET /admin/daily-challenges/api
- 역할: 캘린더 범위 내 배정된 챌린지 목록 조회 (FullCalendar events 용)
- Query Params: `from` (ISO date), `to` (ISO date)
- Response: `List<DailyChallengeItem>` (challengeDate, questionUuid, topicName, difficulty, stemPreview)

### PUT /admin/daily-challenges/{date}
- 역할: 특정 날짜에 문제 배정 (upsert)
- Path: `date` (ISO date, e.g. 2026-04-08)
- Body: `{ "questionUuid": "UUID" }`
- Response: `DailyChallengeItem`
- Error: 422 if questionUuid is inactive

### DELETE /admin/daily-challenges/{date}
- 역할: 특정 날짜 배정 해제 (폴백 복귀)
- Path: `date` (ISO date)
- Response: 200 OK
