<!-- 제목: ⚙️ [기능개선][API] be-api-docs.json v0.0.3 API 스펙 변경 프론트 코드 반영 -->

## 📝 현재 문제점

- 백엔드 #22(Entity UUID 통일) 이슈로 API 스펙이 대폭 변경되었으나, 프론트 코드(`src/api/`, `src/types/`, `src/stores/`)는 구 스펙(Long ID, `X-User-UUID` 헤더) 기반으로 동작 중
- 변경된 스펙: 모든 Entity ID가 Long에서 UUID로 전환, 인증 헤더 `X-User-UUID` -> `X-Member-UUID`, submit body 필드명 변경
- 신규 API 4개(today, recommendations, home/greeting, exam-schedules)가 추가되었으나 프론트에 미반영
- `api-guide.md` 문서는 이미 v0.0.3 기준으로 동기화 완료 (커밋 `10223aa`)

## 🛠️ 해결 방안 / 제안 기능

- `api-guide.md`를 single source of truth로 삼아 프론트 코드를 동기화
- Breaking change가 많으므로 타입 정의 -> API 함수 -> 스토어/훅 -> 페이지 순서로 단계적 반영

## ⚙️ 작업 내용

### 1단계: 타입 정의 업데이트 (`src/types/api.ts`)
- [ ] 모든 `id: number` 필드를 `questionUuid: string`, `memberUuid: string` 등 UUID 기반으로 변경
- [ ] `ProgressSummary` -> `ProgressResponse` 타입 rename + 필드 변경
- [ ] `TodayQuestion` -> `TodayQuestionResponse` 타입 추가 (`question: QuestionSummary | null`, `alreadySolvedToday: boolean`)
- [ ] `RecommendationsResponse` 타입 추가 (`questions: QuestionSummary[]`)
- [ ] `GreetingResponse` 타입 추가 (`message: string`)
- [ ] `ExamScheduleResponse` 타입 추가 (`examScheduleUuid`, `certType`, `round`, `examDate`, `isSelected`)
- [ ] `SimilarQuestion` 타입: `questionId` -> `questionUuid`, `topicCode` -> `topicName`

### 2단계: API 클라이언트 업데이트 (`src/api/`)
- [ ] `client.ts`: 인증 헤더 `X-User-UUID` -> `X-Member-UUID` 변경
- [ ] `questions.ts`: 경로 `/{id}` -> `/{questionUuid}`, `submitAnswer` body `selectedKey` -> `selectedChoiceKey`
- [ ] `ai.ts`: `explainError` body에서 `user_uuid` 제거 + `question_id` -> `questionUuid`, `fetchSimilar` 경로 변경
- [ ] `progress.ts`: `fetchProgress` 인증 방식 헤더 -> query param, `fetchHeatmap` 삭제
- [ ] 신규 `home.ts`: `fetchGreeting(memberUuid)` 함수 추가
- [ ] 신규 `examSchedules.ts`: `fetchExamSchedules(certType?)`, `fetchSelectedSchedule()` 함수 추가
- [ ] `questions.ts`: `fetchTodayQuestion(memberUuid?)`, `fetchRecommendations(size?, excludeQuestionUuid?)` 함수 추가

### 3단계: 스토어/훅 업데이트
- [ ] `memberStore.ts`: UUID 필드명 확인 및 정합성 검증
- [ ] `useProgress.ts`: `ProgressSummary` -> `ProgressResponse` 타입 교체, heatmap 훅 제거
- [ ] 신규 훅 추가: `useGreeting`, `useExamSchedule`, `useTodayQuestion`, `useRecommendations`

### 4단계: 페이지 컴포넌트 업데이트
- [ ] `Home.tsx`: greeting, today question, recommendations, exam schedule 호출 추가, heatmap 호출 제거
- [ ] `QuestionDetail.tsx`: `id` -> `questionUuid` 라우트 파라미터 변경
- [ ] `Questions.tsx`: 라우팅 링크 UUID 기반으로 변경
- [ ] `Stats.tsx`: heatmap 섹션 제거, ProgressResponse 필드 반영
- [ ] `AnswerFeedback.tsx`: similar question 경로 UUID 반영

### 5단계: 라우팅 업데이트
- [ ] React Router 경로: `/questions/:id` -> `/questions/:questionUuid`

## 🙋‍ 담당자

- 프론트엔드: @EM-H20
