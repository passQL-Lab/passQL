# api-guide.md 동기화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `.claude/rules/api-guide.md`를 be-api-docs.json v0.0.3 기준으로 증분 업데이트한다.

**Architecture:** 단일 파일(api-guide.md) 텍스트 패치. 전역 치환 -> 도메인별 섹션 수정 -> 화면별 흐름 업데이트 -> 코드 패턴 헤더명 수정 순서로 진행.

**Tech Stack:** Markdown 문서 편집

**Spec:** `docs/superpowers/specs/2026-04-08-api-guide-sync-design.md`

---

### Task 1: 전역 치환 (헤더명, 경로, 총 개수)

**Files:**
- Modify: `.claude/rules/api-guide.md`

- [ ] **Step 1: 인증 헤더명 전역 치환**

`X-User-UUID` -> `X-Member-UUID` (파일 전체, replace_all)

```
old: X-User-UUID
new: X-Member-UUID
```

- [ ] **Step 2: 엔드포인트 총 개수 변경**

```
old: ## 엔드포인트 전체 목록 (15개)
new: ## 엔드포인트 전체 목록 (18개)
```

- [ ] **Step 3: 변경 확인**

파일을 읽어서 `X-User-UUID`가 0건, `X-Member-UUID`가 기존 위치에 정상 반영되었는지 확인.

---

### Task 2: Questions 도메인 테이블 수정

**Files:**
- Modify: `.claude/rules/api-guide.md` (Lines 30~40 부근, Questions 테이블)

- [ ] **Step 1: Questions 테이블 교체**

기존 테이블:

```markdown
| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchQuestions(params)` | GET | `/questions?page&size&topic&subtopic&difficulty&mode` | - | `Page<QuestionSummary>` | O |
| `fetchQuestion(id)` | GET | `/questions/{id}` | - | `QuestionDetail` | O |
| `fetchTodayQuestion()` | GET | `/questions/today` | O | `TodayQuestion` | 미구현 |
| `submitAnswer(id, selectedKey)` | POST | `/questions/{id}/submit` | O | `SubmitResult` | O |
| `executeChoice(id, sql)` | POST | `/questions/{id}/execute` | - | `ExecuteResult` | O |
```

새 테이블:

```markdown
| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchQuestions(params)` | GET | `/questions?page&size&topic&subtopic&difficulty&mode` | - | `Page<QuestionSummary>` | O |
| `fetchQuestion(questionUuid)` | GET | `/questions/{questionUuid}` | - | `QuestionDetail` | O |
| `fetchTodayQuestion(memberUuid?)` | GET | `/questions/today?memberUuid` | O (query param) | `TodayQuestionResponse` | O |
| `fetchRecommendations(size?, excludeQuestionUuid?)` | GET | `/questions/recommendations?size&excludeQuestionUuid` | - | `RecommendationsResponse` | O |
| `submitAnswer(questionUuid, selectedChoiceKey)` | POST | `/questions/{questionUuid}/submit` | O (header) | `SubmitResult` | O |
| `executeChoice(questionUuid, sql)` | POST | `/questions/{questionUuid}/execute` | - | `ExecuteResult` | O |
```

- [ ] **Step 2: Questions 부연 설명 교체**

기존:

```markdown
- `fetchTodayQuestion`: 오늘의 문제 + D-day (백엔드가 계산). 홈 화면에서 사용.
```

새 내용:

```markdown
- `fetchTodayQuestion`: 오늘의 데일리 챌린지 문제 반환. 큐레이션 행(daily_challenge)이 있으면 그 문제, 없으면 활성 문제 풀에서 날짜 시드 기반 결정적 폴백. `memberUuid`가 주어지면 오늘 해당 문제 제출 여부를 `alreadySolvedToday`로 함께 반환. 활성 문제 0개면 `{ question: null, alreadySolvedToday: false }`.
- `fetchRecommendations`: 활성 문제 풀에서 랜덤 N개 반환. size 기본 3, 최대 5 (초과 시 5로 clamp, 1 미만은 1). `excludeQuestionUuid` 미지정 시 데일리 챌린지 자동 제외.
- `submitAnswer`: body 필드 `selectedChoiceKey` (구 필드명 `selectedKey` 한시적 fallback 지원). 인증 헤더 `X-Member-UUID` 필수.
```

---

### Task 3: AI 도메인 수정

**Files:**
- Modify: `.claude/rules/api-guide.md` (Lines 42~69 부근, AI 섹션)

- [ ] **Step 1: AI 테이블 교체**

기존:

```markdown
| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `explainError(payload)` | POST | `/ai/explain-error` | O | `AiResult` | O |
| `diffExplain(payload)` | POST | `/ai/diff-explain` | O | `AiResult` | O |
| `fetchSimilar(questionId, k=5)` | GET | `/ai/similar/{questionId}?k` | - | `SimilarQuestion[]` | O |
```

새 테이블:

```markdown
| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `explainError(payload)` | POST | `/ai/explain-error` | O (header) | `AiResult` | O |
| `diffExplain(payload)` | POST | `/ai/diff-explain` | O (header) | `AiResult` | O |
| `fetchSimilar(questionUuid, k=5)` | GET | `/ai/similar/{questionUuid}?k` | - | `SimilarQuestion[]` | O |
```

- [ ] **Step 2: explainError body 스펙 수정**

기존:

```markdown
`explainError`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `user_uuid` | string | O | 사용자 UUID |
| `question_id` | integer | O | 문제 ID |
| `sql` | string | O | 사용자가 작성한 SQL |
| `error_message` | string | O | 발생한 에러 메시지 |
```

새 내용:

```markdown
`explainError`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `questionUuid` | string (UUID) | O | 문제 UUID |
| `sql` | string | O | 사용자가 작성한 SQL |
| `error_message` | string | O | 발생한 에러 메시지 |

- `user_uuid`는 프론트에서 전달하지 않음 (헤더 `X-Member-UUID`로 대체).
```

- [ ] **Step 3: diffExplain body 스펙 수정**

기존:

```markdown
`diffExplain`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `question_id` | integer | O | 문제 ID |
| `selected_key` | string | O | 사용자가 선택한 답 키 |

(프론트는 위 2개만 전달. 백엔드가 나머지 필드 `user_uuid`, `correct_key`, `question_stem`, `choice_bodies`를 자동으로 조회하여 AI 서버로 프록시)
```

새 내용:

```markdown
`diffExplain`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `question_id` | integer | O | 문제 ID |
| `selected_key` | string | O | 사용자가 선택한 답 키 |

(프론트는 위 2개만 전달. 백엔드가 나머지 필드 `correct_key`, `question_stem`, `choice_bodies`를 자동으로 조회하고 `X-Member-UUID` 헤더에서 사용자를 식별하여 AI 서버로 프록시)
```

- [ ] **Step 4: SimilarQuestion 응답 필드 보강**

기존 `fetchSimilar` 관련 설명:

```markdown
`fetchSimilar`는 백엔드가 AI 결과를 보강 (`SimilarQuestion`에 `stem`, `topicCode` 추가).
```

새 내용:

```markdown
`fetchSimilar`는 백엔드가 AI 결과를 보강 (`SimilarQuestion`에 `stem`, `topicName` 추가). 응답: `SimilarQuestion { questionUuid, stem, topicName, score }`.
```

---

### Task 4: Progress 도메인 수정

**Files:**
- Modify: `.claude/rules/api-guide.md` (Lines 71~79 부근, Progress 섹션)

- [ ] **Step 1: Progress 테이블 + 설명 교체**

기존:

```markdown
### Progress (`src/api/progress.ts`)

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchProgress()` | GET | `/progress` | O | `ProgressSummary` | O |
| `fetchHeatmap()` | GET | `/progress/heatmap` | O | `HeatmapEntry[]` | O |
| `fetchRecentWrong(limit)` | GET | `/progress/recent-wrong?limit` | O | `RecentWrongItem[]` | 미구현 |

- `fetchRecentWrong`: 통계 화면 "최근 틀린 문제" 리스트. 백엔드 미구현 시 통계 화면에서 해당 섹션 생략.
```

새 내용:

```markdown
### Progress (`src/api/progress.ts`)

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchProgress(memberUuid)` | GET | `/progress?memberUuid` | O (query param) | `ProgressResponse` | O |

- `fetchProgress`: 응답 필드 `solvedCount`(int64, distinct questionUuid 기준), `correctRate`(double, 0.0~1.0 둘째자리 반올림, 마지막 시도 기준), `streakDays`(int32, 하루 그레이스 -- 오늘 미제출이어도 어제까지 연속이면 유지). 제출 이력 0건이면 `{ 0, 0.0, 0 }`.
```

---

### Task 5: 신규 도메인 추가 (Home, ExamSchedule)

**Files:**
- Modify: `.claude/rules/api-guide.md` (Meta 섹션 바로 뒤에 삽입)

- [ ] **Step 1: Home 도메인 섹션 추가**

Meta 섹션 뒤에 삽입:

```markdown
### Home (`src/api/home.ts`)

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchGreeting(memberUuid)` | GET | `/home/greeting?memberUuid` | O (query param) | `GreetingResponse` | O |

- `fetchGreeting`: 홈 화면 인사 메시지 반환. `GreetingResponse { message: string }`.
```

- [ ] **Step 2: ExamSchedule 도메인 섹션 추가**

Home 섹션 뒤에 삽입:

```markdown
### ExamSchedule (`src/api/examSchedules.ts`)

| 함수 | 메서드 | 경로 | 인증 | 응답 타입 | 상태 |
|------|--------|------|:----:|-----------|:----:|
| `fetchExamSchedules(certType?)` | GET | `/exam-schedules?certType` | - | `ExamScheduleResponse[]` | O |
| `fetchSelectedSchedule()` | GET | `/exam-schedules/selected` | - | `ExamScheduleResponse \| null` | O |

- `fetchExamSchedules`: `certType`(SQLD/SQLP) 필터. 미입력 시 전체 조회. certType + round 오름차순 정렬.
- `fetchSelectedSchedule`: `isSelected = true`인 단일 일정 반환. 선택된 일정 없으면 200 + null body (홈 화면 greeting fallback 처리).
- `ExamScheduleResponse { examScheduleUuid, certType, round, examDate, isSelected }`.
```

---

### Task 6: 화면별 API 호출 흐름 업데이트

**Files:**
- Modify: `.claude/rules/api-guide.md` (Lines 88~121 부근, 화면별 흐름 섹션)

- [ ] **Step 1: 홈 화면 흐름 교체**

기존:

```markdown
### 홈 화면 (병렬 호출)

\```
진입 시 동시 호출:
- GET /members/me         → 닉네임
- GET /progress           → 푼 문제, 정답률, 스트릭
- GET /questions/today    → 오늘의 문제 + D-day
- GET /progress/heatmap   → 취약 영역 top 2
\```
```

새 내용:

```markdown
### 홈 화면 (병렬 호출)

\```
진입 시 동시 호출:
- GET /members/me                → 닉네임
- GET /home/greeting             → 인사 메시지
- GET /progress?memberUuid       → 푼 문제, 정답률, 스트릭
- GET /questions/today           → 오늘의 문제 + 풀이 여부
- GET /questions/recommendations → 추천 문제
- GET /exam-schedules/selected   → 선택된 시험 일정
\```
```

- [ ] **Step 2: 문제 상세 흐름 UUID 반영**

경로의 `{id}`를 `{questionUuid}`로 변경:

```markdown
1. 화면 진입 → GET /questions/{questionUuid}
2. 선택지 클릭 → POST /questions/{questionUuid}/execute (body: `{ sql: "..." }`) (자동 호출)
   ...
5. [제출하기] → POST /questions/{questionUuid}/submit → 결과 화면으로 이동
```

- [ ] **Step 3: 결과 화면 유사 문제 경로 변경**

```markdown
- 유사 문제: GET /ai/similar/{questionUuid}?k=3 (P1, 옵션)
```

---

### Task 7: 코드 패턴 섹션 헤더명 수정

**Files:**
- Modify: `.claude/rules/api-guide.md` (Lines 123~131 부근)

- [ ] **Step 1: 인증 헤더 예시 수정**

이 변경은 Task 1의 전역 치환에서 이미 처리됨. 확인만 수행:

```markdown
2. **인증 헤더** — 인증(O) 엔드포인트는 `headers: { "X-Member-UUID": getMemberUuid() }` 주입. `getMemberUuid()`는 `src/stores/memberStore.ts`에서 import.
```

`X-User-UUID`가 남아있지 않은지 확인.

---

### Task 8: 최종 검증 + 커밋

**Files:**
- Verify: `.claude/rules/api-guide.md`

- [ ] **Step 1: 잔여 확인**

파일에서 다음이 0건인지 확인:
- `X-User-UUID` (전부 `X-Member-UUID`로 변경되었어야 함)
- `/questions/{id}` (전부 `/{questionUuid}`로 변경되었어야 함)
- `/{questionId}` (전부 `/{questionUuid}`로 변경되었어야 함)
- `ProgressSummary` (전부 `ProgressResponse`로 변경되었어야 함)
- `fetchHeatmap` (삭제되었어야 함)
- `fetchRecentWrong` (삭제되었어야 함)
- `15개` (18개로 변경되었어야 함)

- [ ] **Step 2: 커밋**

```bash
git add .claude/rules/api-guide.md
git commit -m "docs: api-guide.md를 be-api-docs.json v0.0.3 기준으로 동기화

- Entity ID Long -> UUID 전환 반영 (#22)
- 인증 헤더 X-User-UUID -> X-Member-UUID
- 신규 API 3개 추가: recommendations, home/greeting, exam-schedules
- questions/today 미구현 -> 구현 상태 변경
- progress/heatmap, progress/recent-wrong 삭제
- Progress 인증 방식 헤더 -> query param 변경"
```
