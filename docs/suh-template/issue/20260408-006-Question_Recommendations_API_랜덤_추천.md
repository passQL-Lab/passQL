🎲 [기능추가][Server] Question Recommendations API — 랜덤 추천 풀

📝 현재 문제점
---

- 데일리 챌린지 1문제 외에도 사용자가 "뭐 풀지 모르겠을 때" 가볍게 골라잡을 수 있는 추천 풀이 필요합니다.
- D3 시점에는 화면 연결이 없지만, D5 홈 화면 확장(또는 통계/문제 목록 보조)에서 즉시 사용할 수 있도록 API는 미리 만들어둡니다.

🛠️ 해결 방안 / 제안 기능
---

- `GET /api/questions/recommendations?size=N` 엔드포인트를 신설합니다.
- 호출할 때마다 랜덤 N개 활성 문제를 반환합니다 (기본 3, 최대 5).
- 오늘의 데일리 챌린지로 결정된 문제는 응답에서 제외하여 중복을 막습니다.
- 캐싱은 두지 않습니다 (매 호출마다 새로 섞여야 함).

📚 참고 문서
---

- 설계 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md` §4.4
- 의존: `.issue/20260408-001-Flyway_V1_보강_submission_및_question_is_active.md` (question.is_active)
- 연관: `.issue/20260408-005-Daily_Challenge_도메인_및_오늘의_챌린지_API.md` (오늘의 문제 제외 로직)

⚙️ 작업 내용
---

### 📌 API

- [ ] `GET /api/questions/recommendations?size=3` 엔드포인트 추가
- [ ] Response DTO: `RecommendationsResponse { questions: List<QuestionSummary> }`
  - `QuestionSummary { questionUuid, topicName, difficulty, stemPreview }`
- [ ] `size` 파라미터: 기본 3, 최대 5 (초과 시 5로 clamp)
- [ ] 오늘의 데일리 챌린지(`getToday`로 결정된 문제)의 questionUuid는 응답에서 제외
- [ ] 활성 문제가 size보다 적으면 가능한 만큼만 반환

### 📌 QuestionRepository / QuestionService

- [ ] `QuestionService.getRecommendations(int size, UUID excludeQuestionUuid) → RecommendationsResponse`
- [ ] Postgres 기반 랜덤 쿼리
  ```sql
  SELECT * FROM question
  WHERE is_active = true
    AND (:exclude IS NULL OR question_uuid <> :exclude)
  ORDER BY RANDOM()
  LIMIT :size
  ```
- [ ] 캐싱 없음

### ✅ 단위 테스트

- [ ] 활성 문제 10개 + 제외 1개 → size=3 응답, 제외 ID 미포함
- [ ] 활성 문제 2개 + size=3 → 2개 반환
- [ ] 활성 문제 0개 → 빈 리스트
- [ ] size=10 요청 → 5개로 clamp

### 📌 비고

- D3에 API만 구현하고, 화면(홈/문제 목록 보조 등) 연결은 D5에 결정.
- 어드민 화면 별도 없음 (단순 조회 API).

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
