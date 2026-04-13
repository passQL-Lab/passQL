⚙️ [기능추가][설정][건의사항] 건의사항 API 연결

📝 현재 문제점
---

- 건의사항 UI(`SettingsFeedback`, `FeedbackForm`, `FeedbackList`)와 API 함수(`src/api/feedback.ts`)는 이미 구현되어 있으나, 백엔드 API가 미구현 상태였기 때문에 현재 임시 fallback 처리 중
- `useMyFeedback` 훅에서 `GET /feedback/me` 응답 404 시 빈 배열(`{ items: [] }`)로 graceful fallback 처리 중 (임시)
- 백엔드 API가 정상 구현됐으므로 fallback 로직을 제거하고 실제 API와 연결 필요

🛠️ 해결 방안 / 제안 기능
---

- `useFeedback.ts`의 `useMyFeedback`에서 404 fallback 분기 제거
- 실제 API 정상 동작 확인 (제출, 목록 조회, 상태값 렌더링)

⚙️ 작업 내용
---

- `client/src/hooks/useFeedback.ts` — 404 fallback 로직 제거
- `client/docs/be-api-docs.json` — 건의사항 API 스펙 추가 (백엔드 OpenAPI 스펙 기준)
- 건의사항 제출 → 목록 refetch → 상태(PENDING/REVIEWED/APPLIED) 렌더링 동작 확인

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
