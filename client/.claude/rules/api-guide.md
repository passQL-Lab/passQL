# API 연동 가이드

## 아키텍처

```
Frontend ──(/api)──> Backend(Spring) ──(x-api-key)──> AI Server(FastAPI)
```

- 프론트는 **백엔드하고만 통신**. AI 서버 직접 호출 금지.
- Base URL: `/api` (같은 origin, 프록시)
- 타임아웃: 25초 (`AbortController`)
- 인증: 사용자 식별이 필요한 엔드포인트는 `X-Member-UUID` 헤더 필수
- **프론트 비즈니스 로직 제로 원칙**: 날짜 계산(D-day), 정답 판정, 닉네임 생성, 정답률 집계 등 모든 비즈니스 로직은 백엔드 책임. 프론트는 응답을 그대로 렌더링.

## 엔드포인트 전체 목록 (22개)

> 구현 상태: [O] = be-api-docs.json에 정의됨, [미구현] = 화면 명세에 필요하나 백엔드 미구현

### Members (`src/api/members.ts`)

| 함수                   | 메서드 | 경로                              |      인증       | 응답 타입                    | 상태 |
| ---------------------- | ------ | --------------------------------- | :-------------: | ---------------------------- | :--: |
| `register()`           | POST   | `/members/register`               |        -        | `MemberRegisterResponse`     |  O   |
| `fetchMe()`            | GET    | `/members/me`                     | O (query param) | `MemberMeResponse`           |  O   |
| `regenerateNickname()` | POST   | `/members/me/regenerate-nickname` | O (query param) | `NicknameRegenerateResponse` |  O   |

- 첫 진입 시 `register` → UUID 발급 → memberStore에 저장.
- `fetchMe`로 닉네임 조회 (홈, 설정 화면).

### Questions (`src/api/questions.ts`)

| 함수                                                | 메서드 | 경로                                                  |      인증       | 응답 타입                 | 상태 |
| --------------------------------------------------- | ------ | ----------------------------------------------------- | :-------------: | ------------------------- | :--: |
| `fetchQuestions(params)`                            | GET    | `/questions?page&size&topic&subtopic&difficulty&mode` |        -        | `Page<QuestionSummary>`   |  O   |
| `fetchQuestion(questionUuid)`                       | GET    | `/questions/{questionUuid}`                           |        -        | `QuestionDetail`          |  O   |
| `fetchTodayQuestion(memberUuid?)`                   | GET    | `/questions/today?memberUuid`                         | O (query param) | `TodayQuestionResponse`   |  O   |
| `fetchRecommendations(size?, excludeQuestionUuid?)` | GET    | `/questions/recommendations?size&excludeQuestionUuid` |        -        | `RecommendationsResponse` |  O   |
| `submitAnswer(questionUuid, choiceSetId, selectedChoiceKey)` | POST | `/questions/{questionUuid}/submit`           |   O (header)    | `SubmitResult`            |  O   |
| `executeChoice(questionUuid, sql)`                  | POST   | `/questions/{questionUuid}/execute`                   |        -        | `ExecuteResult`           |  O   |
| `generateChoices(questionUuid)`                     | POST   | `/questions/{questionUuid}/generate-choices`          |   O (header)    | SSE stream                |  O   |

- `fetchQuestions`: `QuestionSummary`에 `topicCode`, `executionMode`("EXECUTABLE"|"CONCEPT_ONLY"), `createdAt` 필드 추가됨.
- `fetchQuestion`: 응답 `QuestionDetail`의 선택지 구조가 `choices: ChoiceItem[]` -> `choiceSets: ChoiceSetSummary[]`로 변경됨. `ChoiceSetSummary { choiceSetUuid, source, status, sandboxValidationPassed, createdAt, items: ChoiceItem[] }`. `ChoiceItem`에 `isCorrect`, `rationale` 필드 추가. 또한 `schemaDdl`, `schemaSampleData`, `schemaIntent`, `answerSql`, `hint` 필드 추가.
- `fetchTodayQuestion`: 오늘의 데일리 챌린지 문제 반환. 큐레이션 행(daily_challenge)이 있으면 그 문제, 없으면 활성 문제 풀에서 날짜 시드 기반 결정적 폴백. `memberUuid`가 주어지면 오늘 해당 문제 제출 여부를 `alreadySolvedToday`로 함께 반환. 활성 문제 0개면 `{ question: null, alreadySolvedToday: false }`.
- `fetchRecommendations`: 활성 문제 풀에서 랜덤 N개 반환. size 기본 3, 최대 5 (초과 시 5로 clamp, 1 미만은 1). `excludeQuestionUuid` 미지정 시 데일리 챌린지 자동 제외.
- `submitAnswer`: body 필드 `choiceSetId`(UUID, 필수) + `selectedChoiceKey`. 인증 헤더 `X-Member-UUID` 필수. 응답 `SubmitResult`에 `selectedResult`/`correctResult`(ExecuteResult), `correctSql`/`selectedSql` 필드 추가됨 — EXECUTABLE 문제에서 양쪽 SQL 실행 결과 비교 가능.
- `generateChoices`: AI가 4지선다 선택지를 실시간 SSE 스트림으로 생성. 이벤트 타입: `status`(generating/validating), `complete`(choiceSetId+choices), `error`. 헤더 `X-Member-UUID` 필수.

### AI (`src/api/ai.ts`)

| 함수                              | 메서드 | 경로                           |    인증    | 응답 타입           | 상태 |
| --------------------------------- | ------ | ------------------------------ | :--------: | ------------------- | :--: |
| `explainError(payload)`           | POST   | `/ai/explain-error`            | O (header) | `AiResult`          |  O   |
| `diffExplain(payload)`            | POST   | `/ai/diff-explain`             | O (header) | `AiResult`          |  O   |
| `fetchSimilar(questionUuid, k=5)` | GET    | `/ai/similar/{questionUuid}?k` |     -      | `SimilarQuestion[]` |  O   |

**AI 요청 body 스펙** (백엔드가 AI 서버로 프록시 — 필드 누락 시 422):

`explainError`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `questionUuid` | string (UUID) | O | 문제 UUID |
| `sql` | string | O | 사용자가 작성한 SQL |
| `errorMessage` | string | O | 발생한 에러 메시지 |

- `user_uuid`는 프론트에서 전달하지 않음 (헤더 `X-Member-UUID`로 대체).

`diffExplain`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `questionUuid` | string (UUID) | O | 문제 UUID |
| `selectedChoiceKey` | string | O | 사용자가 선택한 답 키 |

(프론트는 위 2개만 전달. 백엔드가 나머지 필드 `correct_key`, `question_stem`, `choice_bodies`를 자동으로 조회하고 `X-Member-UUID` 헤더에서 사용자를 식별하여 AI 서버로 프록시)

**참고**: 백엔드가 AI 서버 응답을 camelCase로 변환하여 내려줌 (`prompt_version` → `promptVersion`).
`fetchSimilar`는 백엔드가 AI 결과를 보강 (`SimilarQuestion`에 `stem`, `topicName` 추가). 응답: `SimilarQuestion { questionUuid, stem, topicName, score }`.

### Progress (`src/api/progress.ts`)

| 함수                                          | 메서드 | 경로                                   |      인증       | 응답 타입                | 상태 |
| --------------------------------------------- | ------ | -------------------------------------- | :-------------: | ------------------------ | :--: |
| `fetchProgress(memberUuid)`                   | GET    | `/progress?memberUuid`                 | O (query param) | `ProgressResponse`       |  O   |
| `fetchTopicAnalysis(memberUuid)`              | GET    | `/progress/topic-analysis?memberUuid`  | O (query param) | `TopicAnalysisResponse`  |  O   |
| `fetchHeatmap(memberUuid, from?, to?)`        | GET    | `/progress/heatmap?memberUuid&from&to` | O (query param) | `HeatmapResponse`        |  O   |
| `fetchAiComment(memberUuid)`                  | GET    | `/progress/ai-comment?memberUuid`      | O (query param) | `AiCommentResponse`      |  O   |

- `fetchProgress`: 응답 필드 `solvedCount`(int64, distinct questionUuid 기준), `correctRate`(double, 0.0~1.0 둘째자리 반올림, 마지막 시도 기준), `streakDays`(int32, 하루 그레이스 -- 오늘 미제출이어도 어제까지 연속이면 유지). 제출 이력 0건이면 `{ 0, 0.0, 0 }`. `readiness` 블록: `ReadinessResponse { score, accuracy, coverage, recency, lastStudiedAt, recentAttemptCount, coveredTopicCount, activeTopicCount, daysUntilExam, toneKey }`. score = Accuracy x Coverage x Recency (0.0~1.0). toneKey: NO_EXAM/ONBOARDING/POST_EXAM/TODAY/SPRINT/PUSH/STEADY/EARLY.
- `fetchTopicAnalysis`: 토픽별 학습 분석. `TopicAnalysisResponse { topicStats: TopicStat[] }`. `TopicStat { topicUuid, displayName, totalQuestionCount, correctRate, solvedCount }`.
- `fetchHeatmap`: 날짜별 학습 기록. `HeatmapResponse { entries: HeatmapEntry[] }`. `HeatmapEntry { date, solvedCount, correctCount }`.
- `fetchAiComment`: AI가 생성한 학습 영역 분석 코멘트. `AiCommentResponse { comment, generatedAt }`.

### Meta (`src/api/meta.ts`)

| 함수            | 메서드 | 경로           | 인증 | 응답 타입      | 상태 |
| --------------- | ------ | -------------- | :--: | -------------- | :--: |
| `fetchTopics()` | GET    | `/meta/topics` |  -   | `TopicTree[]`  |  O   |
| `fetchTags()`   | GET    | `/meta/tags`   |  -   | `ConceptTag[]` |  O   |

- `fetchTopics`: `TopicTree`에 `topicUuid`(UUID), `sortOrder`, `isActive` 필드 추가. `SubtopicItem`에 `sortOrder`, `isActive` 필드 추가.
- `fetchTags`: `ConceptTag`에 `conceptTagUuid`(UUID), audit 필드(`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) 추가.

### Home (`src/api/home.ts`)

| 함수                        | 메서드 | 경로                        |      인증       | 응답 타입          | 상태 |
| --------------------------- | ------ | --------------------------- | :-------------: | ------------------ | :--: |
| `fetchGreeting(memberUuid)` | GET    | `/home/greeting?memberUuid` | O (query param) | `GreetingResponse` |  O   |

- `fetchGreeting`: 홈 화면 인사 메시지 반환(#53). `GreetingResponse { nickname, message, messageType }`. `message`에 `{nickname}` 플레이스홀더 포함 -- 프론트에서 치환. `messageType`: GENERAL/COUNTDOWN/URGENT/EXAM_DAY. D-day 구간에 따라 일반 메시지와 가중치 혼합. 회원 조회 실패 시 nickname="회원" + GENERAL 폴백.

### ExamSchedule (`src/api/examSchedules.ts`)

| 함수                            | 메서드 | 경로                       | 인증 | 응답 타입                      | 상태 |
| ------------------------------- | ------ | -------------------------- | :--: | ------------------------------ | :--: |
| `fetchExamSchedules(certType?)` | GET    | `/exam-schedules?certType` |  -   | `ExamScheduleResponse[]`       |  O   |
| `fetchSelectedSchedule()`       | GET    | `/exam-schedules/selected` |  -   | `ExamScheduleResponse \| null` |  O   |

- `fetchExamSchedules`: `certType`(SQLD/SQLP) 필터. 미입력 시 전체 조회. certType + round 오름차순 정렬.
- `fetchSelectedSchedule`: `isSelected = true`인 단일 일정 반환. 선택된 일정 없으면 200 + null body (홈 화면 greeting fallback 처리).
- `ExamScheduleResponse { examScheduleUuid, certType, round, examDate, isSelected }`.

## 화면별 API 호출 흐름

### 문제 상세 → 결과 (핵심 플로우)

```
1. 화면 진입 → GET /questions/{questionUuid}
2. 선택지 클릭 → POST /questions/{questionUuid}/execute (body: `{ sql: "..." }`) (자동 호출)
   - SUCCESS → 결과 테이블 인라인 표시
   - ERROR  → 에러 코드/메시지 표시 + [AI에게 물어보기] 버튼
3. 같은 선택지 재클릭 → 클라이언트 캐시에서 재표시 (재호출 금지)
4. ERROR 시 [AI에게 물어보기] → POST /ai/explain-error
5. [제출하기] → POST /questions/{questionUuid}/submit → 결과 화면으로 이동
6. 오답이면 [AI 해설 받기] → POST /ai/diff-explain
```

**선택지 자동 실행 캐시 정책**: 선택지별 실행 결과를 `Record<sql, ExecuteResult>`로 로컬 state에 보관. 동일 sql 재클릭 시 API 재호출하지 않고 캐시 결과 표시. rate limit 소진 방지 목적.

### 홈 화면 (병렬 호출)

```
진입 시 동시 호출:
- GET /members/me                → 닉네임
- GET /home/greeting             → 인사 메시지
- GET /progress?memberUuid       → 푼 문제, 정답률, 스트릭
- GET /questions/today           → 오늘의 문제 + 풀이 여부
- GET /questions/recommendations → 추천 문제
- GET /exam-schedules/selected   → 선택된 시험 일정
```

### 결과 화면

```
- submit 결과는 navigate state 또는 query cache로 전달 (API 재호출 아님)
- 오답 시 diff-explain 호출 → "학습 포인트" 렌더링
- 유사 문제: GET /ai/similar/{questionUuid}?k=3 (P1, 옵션)
```

## 코드 패턴 (새 엔드포인트 추가 시 필수)

1. **`apiFetch<T>()` 래퍼 필수** — `fetch()` 직접 호출 금지. `src/api/client.ts`의 래퍼가 타임아웃, Content-Type, 에러 변환을 처리함.
2. **인증 헤더** — 인증(O) 엔드포인트는 `headers: { "X-Member-UUID": getMemberUuid() }` 주입. `getMemberUuid()`는 `src/stores/memberStore.ts`에서 import.
3. **응답 타입** — `src/types/api.ts`에 `readonly` interface로 정의. 모든 필드 `readonly` 필수.
4. **파일 위치** — 도메인별 `src/api/{domain}.ts`. 새 도메인이면 새 파일 생성.
5. **쿼리 파라미터** — `URLSearchParams`로 조립. optional 파라미터는 `!= null` 체크 후 set.
6. **POST body** — `JSON.stringify()` 후 body에 전달. Content-Type은 client.ts가 자동 설정.
7. **미구현 API 호출부** — 백엔드 미구현 엔드포인트의 API 함수는 작성하되, 호출부(페이지/컴포넌트)에서는 에러 시 해당 섹션을 graceful하게 숨김 처리.

## 에러 처리

### ApiError 구조

```typescript
class ApiError extends Error {
  readonly status: number; // HTTP 상태 코드
  readonly body: unknown; // 서버 응답 body (JSON 파싱 실패 시 null)
}
```

### 비즈니스 에러 (HTTP 200이지만 실패)

`ExecuteResult`는 HTTP 200으로 내려오지만 SQL 실행 실패를 포함할 수 있다.

```typescript
const result = await executeChoice(id, choiceKey);
if (result.errorCode) {
  // SQL 실행 실패 — result.errorCode, result.errorMessage로 분기
  // ERROR 시 [AI에게 물어보기] 버튼 표시
} else {
  // 정상 — result.columns, result.rows로 결과 테이블 렌더링
}
```

- `ExecuteResult.status`로 성공/실패 판별, `errorCode`/`errorMessage`로 구체적 원인 표시.
- HTTP 에러와 혼동 금지 — 이 패턴은 **catch가 아니라 응답 필드 체크**로 처리.

### 422 Validation Error (AI 엔드포인트)

AI 요청 body 필드 누락/타입 오류 시 백엔드가 422를 프록시할 수 있다.

```typescript
// ApiError.body 구조
{
  detail: [{ loc: ["body", "sql"], msg: "Field required", type: "missing" }];
}
```

- AI 엔드포인트 호출 시 422를 별도 분기하여 어떤 필드가 문제인지 표시.

### HTTP 에러 처리 패턴

```typescript
try {
  const result = await submitAnswer(id, key);
} catch (err) {
  if (err instanceof ApiError) {
    // status별 분기: 400 입력오류, 401 인증실패, 404 리소스없음, 422 유효성오류, 500 서버오류
  } else if (err instanceof DOMException && err.name === "AbortError") {
    // 타임아웃 (25초 초과)
  } else {
    // 네트워크 오류 (오프라인 등)
  }
}
```

### 규칙

- 에러를 **절대 무시(silent swallow)하지 않는다**. 반드시 사용자에게 피드백.
- `ApiError.status`로 분기하여 **상황에 맞는 메시지** 표시.
- `ExecuteResult` 등 **응답 내 에러 필드가 있는 타입은 반드시 체크** — catch만으로 불충분.
- 타임아웃은 "서버 응답 지연" 안내 + 재시도 유도.
- 네트워크 오류는 "인터넷 연결 확인" 안내.
