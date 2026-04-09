# API v0.0.3 프론트 코드 동기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** be-api-docs.json v0.0.3 (Entity UUID 통일, 신규 API) 스펙에 맞춰 프론트 타입/API/훅/페이지 코드를 동기화한다.

**Architecture:** 타입 정의 -> API 함수 -> mock 데이터 -> 훅 -> 라우터/페이지 순서로 bottom-up 반영. 각 태스크는 독립적으로 컴파일 가능하도록 구성.

**Tech Stack:** TypeScript, React 19, React Router DOM, TanStack React Query, Zustand

**Spec:** `docs/issues/20260408_api-spec-v003-frontend-sync.md`, `.claude/rules/api-guide.md`

---

## File Structure

| 파일 | 역할 | 변경 종류 |
|------|------|-----------|
| `src/types/api.ts` | 타입 정의 | Modify |
| `src/api/questions.ts` | Questions API 함수 | Modify |
| `src/api/ai.ts` | AI API 함수 | Modify |
| `src/api/progress.ts` | Progress API 함수 | Modify |
| `src/api/home.ts` | Home API 함수 | Create |
| `src/api/examSchedules.ts` | ExamSchedule API 함수 | Create |
| `src/api/mock-data.ts` | Mock 데이터 | Modify |
| `src/hooks/useProgress.ts` | Progress 훅 | Modify |
| `src/hooks/useQuestionDetail.ts` | QuestionDetail 훅 | Modify |
| `src/App.tsx` | 라우터 | Modify |
| `src/pages/Home.tsx` | 홈 페이지 | Modify |
| `src/pages/QuestionDetail.tsx` | 문제 상세 페이지 | Modify |
| `src/pages/Questions.tsx` | 문제 목록 페이지 | Modify |
| `src/pages/Stats.tsx` | 통계 페이지 | Modify |
| `src/pages/AnswerFeedback.tsx` | 결과 페이지 | Modify |

---

### Task 1: 타입 정의 업데이트

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: QuestionSummary UUID 전환**

```typescript
// old
export interface QuestionSummary {
  readonly id: number;
  readonly topicCode: string;
  readonly difficulty: number;
  readonly stemPreview: string;
  readonly executionMode: ExecutionMode;
}

// new
export interface QuestionSummary {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly difficulty: number;
  readonly stemPreview: string;
}
```

참고: `executionMode`는 `QuestionSummary`에서 제거 (be-api-docs.json의 `QuestionSummary` 스키마에 없음). `QuestionDetail`에만 존재.

- [ ] **Step 2: QuestionDetail UUID 전환**

```typescript
// old
export interface QuestionDetail {
  readonly id: number;
  readonly topicCode: string;
  readonly subtopicCode: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  readonly choices: readonly ChoiceItem[];
}

// new
export interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  readonly choices: readonly ChoiceItem[];
}
```

- [ ] **Step 3: Progress 타입 교체**

```typescript
// old
export interface ProgressSummary {
  readonly solved: number;
  readonly correctRate: number;
  readonly streakDays: number;
}

export interface HeatmapEntry {
  readonly topicCode: string;
  readonly topicName: string;
  readonly solved: number;
  readonly correctRate: number;
}

// new (HeatmapEntry 삭제, ProgressSummary -> ProgressResponse)
export interface ProgressResponse {
  readonly solvedCount: number;
  readonly correctRate: number;
  readonly streakDays: number;
}
```

- [ ] **Step 4: SimilarQuestion UUID 전환**

```typescript
// old
export interface SimilarQuestion {
  readonly id: number;
  readonly stem: string;
  readonly topicCode: string;
  readonly score: number;
}

// new
export interface SimilarQuestion {
  readonly questionUuid: string;
  readonly stem: string;
  readonly topicName: string;
  readonly score: number;
}
```

- [ ] **Step 5: AI Payload 타입 업데이트**

```typescript
// old
export interface ExplainErrorPayload {
  readonly questionId: number;
  readonly sql: string;
  readonly errorMessage: string;
}

export interface DiffExplainPayload {
  readonly questionId: number;
  readonly selectedKey: string;
}

// new
export interface ExplainErrorPayload {
  readonly questionUuid: string;
  readonly sql: string;
  readonly error_message: string;
}

export interface DiffExplainPayload {
  readonly question_id: number;
  readonly selected_key: string;
}
```

- [ ] **Step 6: 신규 타입 추가**

파일 하단에 추가:

```typescript
// === Today / Recommendations ===
export interface TodayQuestionResponse {
  readonly question: QuestionSummary | null;
  readonly alreadySolvedToday: boolean;
}

export interface RecommendationsResponse {
  readonly questions: readonly QuestionSummary[];
}

// === Home ===
export interface GreetingResponse {
  readonly message: string;
}

// === ExamSchedule ===
export interface ExamScheduleResponse {
  readonly examScheduleUuid: string;
  readonly certType: string;
  readonly round: number;
  readonly examDate: string;
  readonly isSelected: boolean;
}
```

- [ ] **Step 7: 빌드 확인**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: 타입 참조 에러 다수 (아직 API 함수/페이지 미수정). 이 단계에서는 `api.ts` 자체에 에러가 없으면 OK.

- [ ] **Step 8: 커밋**

```bash
git add src/types/api.ts
git commit -m "refactor: api.ts 타입을 be-api-docs.json v0.0.3 스펙으로 전환 #35"
```

---

### Task 2: Questions API 함수 업데이트

**Files:**
- Modify: `src/api/questions.ts`

- [ ] **Step 1: 전체 파일 교체**

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
} from "../types/api";

interface QuestionListParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly subtopic?: string;
  readonly difficulty?: number;
  readonly mode?: string;
}

export function fetchQuestions(
  params: QuestionListParams = {},
): Promise<Page<QuestionSummary>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.size != null) query.set("size", String(params.size));
  if (params.topic) query.set("topic", params.topic);
  if (params.subtopic) query.set("subtopic", params.subtopic);
  if (params.difficulty != null)
    query.set("difficulty", String(params.difficulty));
  if (params.mode) query.set("mode", params.mode);

  return apiFetch(`/questions?${query}`);
}

export function fetchQuestion(questionUuid: string): Promise<QuestionDetail> {
  return apiFetch(`/questions/${questionUuid}`);
}

export function fetchTodayQuestion(memberUuid?: string): Promise<TodayQuestionResponse> {
  const query = new URLSearchParams();
  if (memberUuid) query.set("memberUuid", memberUuid);
  const qs = query.toString();
  return apiFetch(`/questions/today${qs ? `?${qs}` : ""}`);
}

export function fetchRecommendations(
  size?: number,
  excludeQuestionUuid?: string,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams();
  if (size != null) query.set("size", String(size));
  if (excludeQuestionUuid) query.set("excludeQuestionUuid", excludeQuestionUuid);
  const qs = query.toString();
  return apiFetch(`/questions/recommendations${qs ? `?${qs}` : ""}`);
}

export function submitAnswer(
  questionUuid: string,
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ selectedChoiceKey }),
  });
}

export function executeChoice(
  questionUuid: string,
  sql: string,
): Promise<ExecuteResult> {
  return apiFetch(`/questions/${questionUuid}/execute`, {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/api/questions.ts
git commit -m "refactor: questions.ts UUID 경로 + 신규 API 함수 추가 #35"
```

---

### Task 3: AI API 함수 업데이트

**Files:**
- Modify: `src/api/ai.ts`

- [ ] **Step 1: 전체 파일 교체**

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { AiResult, SimilarQuestion, ExplainErrorPayload, DiffExplainPayload } from "../types/api";

export function explainError(payload: ExplainErrorPayload): Promise<AiResult> {
  return apiFetch("/ai/explain-error", {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function diffExplain(payload: DiffExplainPayload): Promise<AiResult> {
  return apiFetch("/ai/diff-explain", {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify(payload),
  });
}

export function fetchSimilar(questionUuid: string, k = 5): Promise<SimilarQuestion[]> {
  return apiFetch(`/ai/similar/${questionUuid}?k=${k}`);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/api/ai.ts
git commit -m "refactor: ai.ts 헤더 X-Member-UUID + UUID 경로 전환 #35"
```

---

### Task 4: Progress API 함수 업데이트

**Files:**
- Modify: `src/api/progress.ts`

- [ ] **Step 1: 전체 파일 교체**

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type { ProgressResponse } from "../types/api";

export function fetchProgress(): Promise<ProgressResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress?memberUuid=${uuid}`);
}
```

`fetchHeatmap` 함수 삭제. Progress는 이제 query param 인증.

- [ ] **Step 2: 커밋**

```bash
git add src/api/progress.ts
git commit -m "refactor: progress.ts query param 인증 + heatmap 삭제 #35"
```

---

### Task 5: 신규 API 파일 생성

**Files:**
- Create: `src/api/home.ts`
- Create: `src/api/examSchedules.ts`

- [ ] **Step 1: home.ts 생성**

```typescript
import { apiFetch } from "./client";
import type { GreetingResponse } from "../types/api";

export function fetchGreeting(memberUuid: string): Promise<GreetingResponse> {
  return apiFetch(`/home/greeting?memberUuid=${memberUuid}`);
}
```

- [ ] **Step 2: examSchedules.ts 생성**

```typescript
import { apiFetch } from "./client";
import type { ExamScheduleResponse } from "../types/api";

export function fetchExamSchedules(certType?: string): Promise<ExamScheduleResponse[]> {
  const query = new URLSearchParams();
  if (certType) query.set("certType", certType);
  const qs = query.toString();
  return apiFetch(`/exam-schedules${qs ? `?${qs}` : ""}`);
}

export function fetchSelectedSchedule(): Promise<ExamScheduleResponse | null> {
  return apiFetch("/exam-schedules/selected");
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/api/home.ts src/api/examSchedules.ts
git commit -m "feat: home.ts, examSchedules.ts 신규 API 함수 추가 #35"
```

---

### Task 6: Mock 데이터 업데이트

**Files:**
- Modify: `src/api/mock-data.ts`

- [ ] **Step 1: import 변경**

```typescript
// old
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  ProgressSummary,
  HeatmapEntry,
  TopicTree,
  ConceptTag,
  AiResult,
  SimilarQuestion,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
} from "../types/api";

// new
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  ProgressResponse,
  TopicTree,
  ConceptTag,
  AiResult,
  SimilarQuestion,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
  TodayQuestionResponse,
  RecommendationsResponse,
  GreetingResponse,
  ExamScheduleResponse,
} from "../types/api";
```

- [ ] **Step 2: MOCK_QUESTIONS UUID 전환**

```typescript
// old: { id: 1, topicCode: "JOIN", ... }
// new:
const MOCK_QUESTIONS: readonly QuestionSummary[] = [
  { questionUuid: "q-uuid-0001", topicName: "JOIN", difficulty: 2, stemPreview: "고객별 주문 수를 구하는 올바른 SQL은?" },
  { questionUuid: "q-uuid-0002", topicName: "서브쿼리", difficulty: 3, stemPreview: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?" },
  { questionUuid: "q-uuid-0003", topicName: "GROUP BY", difficulty: 2, stemPreview: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?" },
  { questionUuid: "q-uuid-0004", topicName: "DDL", difficulty: 1, stemPreview: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?" },
  { questionUuid: "q-uuid-0005", topicName: "제약조건", difficulty: 3, stemPreview: "NOT NULL과 UNIQUE 제약조건의 차이를 올바르게 설명한 것은?" },
  { questionUuid: "q-uuid-0006", topicName: "JOIN", difficulty: 3, stemPreview: "LEFT JOIN과 INNER JOIN의 결과 차이를 올바르게 설명한 것은?" },
  { questionUuid: "q-uuid-0007", topicName: "GROUP BY", difficulty: 1, stemPreview: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?" },
  { questionUuid: "q-uuid-0008", topicName: "DDL", difficulty: 2, stemPreview: "CREATE TABLE 시 DEFAULT 제약조건 문법은?" },
];
```

- [ ] **Step 3: MOCK_QUESTION_DETAIL UUID 전환**

```typescript
const MOCK_QUESTION_DETAIL: QuestionDetail = {
  questionUuid: "q-uuid-0001",
  topicName: "JOIN",
  subtopicName: "INNER JOIN",
  difficulty: 2,
  executionMode: "EXECUTABLE",
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schemaDisplay: "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)",
  choices: [
    { key: "A", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 1 },
    { key: "B", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.cust_id\nGROUP BY c.name", sortOrder: 2 },
    { key: "C", kind: "SQL", body: "SELECT name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY name", sortOrder: 3 },
    { key: "D", kind: "SQL", body: "SELECT c.name, SUM(o.amount) AS total\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 4 },
  ],
};
```

- [ ] **Step 4: MOCK_PROGRESS 교체 + MOCK_HEATMAP 삭제**

```typescript
// old: MOCK_PROGRESS: ProgressSummary + MOCK_HEATMAP: HeatmapEntry[]
// new:
const MOCK_PROGRESS: ProgressResponse = {
  solvedCount: 42,
  correctRate: 0.685,
  streakDays: 3,
};
// MOCK_HEATMAP 전체 삭제
```

- [ ] **Step 5: 신규 mock 상수 추가**

```typescript
const MOCK_TODAY: TodayQuestionResponse = {
  question: MOCK_QUESTIONS[0],
  alreadySolvedToday: false,
};

const MOCK_RECOMMENDATIONS: RecommendationsResponse = {
  questions: MOCK_QUESTIONS.slice(0, 3),
};

const MOCK_GREETING: GreetingResponse = {
  message: "SQLD 시험까지 D-14! 오늘도 화이팅하세요",
};

const MOCK_EXAM_SCHEDULES: readonly ExamScheduleResponse[] = [
  { examScheduleUuid: "es-uuid-0001", certType: "SQLD", round: 1, examDate: "2026-05-10", isSelected: true },
  { examScheduleUuid: "es-uuid-0002", certType: "SQLD", round: 2, examDate: "2026-09-13", isSelected: false },
  { examScheduleUuid: "es-uuid-0003", certType: "SQLP", round: 1, examDate: "2026-06-21", isSelected: false },
];
```

- [ ] **Step 6: getMockResponse 함수 경로 패턴 업데이트**

`getMockResponse` 함수 내부 변경:

```typescript
// GET /questions/:uuid → 숫자가 아닌 UUID 패턴
// old: /^\/questions\/\d+$/.test(path)
// new:
if (method === "GET" && /^\/questions\/[^/]+$/.test(path) && !path.includes("?")) {
  return { ...MOCK_QUESTION_DETAIL, questionUuid: path.split("/")[2] } satisfies QuestionDetail;
}

// POST /questions/:uuid/submit → body 필드명 변경
// old: JSON.parse(body).selectedKey
// new:
if (method === "POST" && path.includes("/submit")) {
  const parsed = body ? JSON.parse(body) : {};
  const selectedChoiceKey = (parsed.selectedChoiceKey ?? parsed.selectedKey) as string;
  const isCorrect = selectedChoiceKey === "A";
  return { isCorrect, correctKey: "A", rationale: "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다." } satisfies SubmitResult;
}

// GET /progress → ProgressResponse (필드명 변경)
if (method === "GET" && path.startsWith("/progress")) {
  return MOCK_PROGRESS satisfies ProgressResponse;
}
// /progress/heatmap 분기 삭제

// 신규: GET /questions/today
if (method === "GET" && path.startsWith("/questions/today")) {
  return MOCK_TODAY satisfies TodayQuestionResponse;
}

// 신규: GET /questions/recommendations
if (method === "GET" && path.startsWith("/questions/recommendations")) {
  return MOCK_RECOMMENDATIONS satisfies RecommendationsResponse;
}

// 신규: GET /home/greeting
if (method === "GET" && path.startsWith("/home/greeting")) {
  return MOCK_GREETING satisfies GreetingResponse;
}

// 신규: GET /exam-schedules/selected
if (method === "GET" && path === "/exam-schedules/selected") {
  return MOCK_EXAM_SCHEDULES.find((s) => s.isSelected) ?? null;
}

// 신규: GET /exam-schedules
if (method === "GET" && path.startsWith("/exam-schedules")) {
  return MOCK_EXAM_SCHEDULES;
}

// GET /ai/similar/:uuid → SimilarQuestion UUID
if (method === "GET" && path.includes("/ai/similar/")) {
  return [
    { questionUuid: "q-uuid-0006", stem: "LEFT JOIN과 INNER JOIN의 결과 차이는?", topicName: "JOIN", score: 0.92 },
    { questionUuid: "q-uuid-0007", stem: "GROUP BY와 HAVING의 실행 순서는?", topicName: "GROUP BY", score: 0.85 },
  ] satisfies SimilarQuestion[];
}
```

주의: `/questions/today`와 `/questions/recommendations`는 `/questions/:uuid` 보다 **먼저** 매칭되어야 함. 순서 조정 필수.

- [ ] **Step 7: 커밋**

```bash
git add src/api/mock-data.ts
git commit -m "refactor: mock-data.ts UUID 전환 + 신규 API mock 추가 #35"
```

---

### Task 7: 훅 업데이트

**Files:**
- Modify: `src/hooks/useProgress.ts`
- Modify: `src/hooks/useQuestionDetail.ts`

- [ ] **Step 1: useProgress.ts 교체**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "../api/progress";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 0,
  });
}
```

`useHeatmap` 함수 삭제.

- [ ] **Step 2: useQuestionDetail.ts UUID 전환**

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer } from "../api/questions";

export function useQuestionDetail(questionUuid: string) {
  return useQuery({
    queryKey: ["question", questionUuid],
    queryFn: () => fetchQuestion(questionUuid),
    staleTime: 0,
  });
}

export function useExecuteChoice(questionUuid: string) {
  return useMutation({
    mutationFn: (sql: string) => executeChoice(questionUuid, sql),
  });
}

export function useSubmitAnswer(questionUuid: string) {
  return useMutation({
    mutationFn: (selectedChoiceKey: string) => submitAnswer(questionUuid, selectedChoiceKey),
  });
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/useProgress.ts src/hooks/useQuestionDetail.ts
git commit -m "refactor: 훅 UUID 전환 + useHeatmap 삭제 #35"
```

---

### Task 8: 라우터 + 페이지 업데이트

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/QuestionDetail.tsx`
- Modify: `src/pages/Questions.tsx`
- Modify: `src/pages/Stats.tsx`
- Modify: `src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: App.tsx 라우터 경로 변경**

```typescript
// old
{ path: "questions/:id", element: <QuestionDetail /> },
// ...
{ path: "questions/:id/result", element: <AnswerFeedback /> },

// new
{ path: "questions/:questionUuid", element: <QuestionDetail /> },
// ...
{ path: "questions/:questionUuid/result", element: <AnswerFeedback /> },
```

- [ ] **Step 2: Home.tsx — ProgressResponse 필드 반영**

```typescript
// old
const solved = progress?.solved ?? 0;
const correctRate = progress?.correctRate ?? 0;
const streak = progress?.streakDays ?? 0;

// new
const solved = progress?.solvedCount ?? 0;
const correctRate = Math.round((progress?.correctRate ?? 0) * 100);
const streak = progress?.streakDays ?? 0;
```

참고: `correctRate`가 이제 0.0~1.0 범위 (기존 0~100). `* 100` 변환 필요.

표시 부분도 수정:

```typescript
// old
<span className="text-h1 text-brand">{Math.round(correctRate)}%</span>
// ...
style={{ width: `${correctRate}%` }}

// new (이미 Math.round 적용됨)
<span className="text-h1 text-brand">{correctRate}%</span>
// ...
style={{ width: `${correctRate}%` }}
```

- [ ] **Step 3: QuestionDetail.tsx — UUID 파라미터 전환**

```typescript
// old
const { id } = useParams<{ id: string }>();
const questionId = Number(id);
const { data: question, isLoading } = useQuestionDetail(questionId);
const executeMutation = useExecuteChoice(questionId);
const submitMutation = useSubmitAnswer(questionId);

// new
const { questionUuid } = useParams<{ questionUuid: string }>();
const { data: question, isLoading } = useQuestionDetail(questionUuid!);
const executeMutation = useExecuteChoice(questionUuid!);
const submitMutation = useSubmitAnswer(questionUuid!);
```

navigate 경로 변경:

```typescript
// old
navigate(`/questions/${questionId}/result`, {
  state: { ...result, selectedKey, selectedSql: selectedChoice?.body, correctSql: correctChoice?.body, questionId },
});

// new
navigate(`/questions/${questionUuid}/result`, {
  state: { ...result, selectedKey, selectedSql: selectedChoice?.body, correctSql: correctChoice?.body, questionUuid },
});
```

explainError 호출 변경:

```typescript
// old
explainMutation.mutate({
  questionId,
  sql: choice?.body ?? "",
  errorMessage,
});

// new
explainMutation.mutate({
  questionUuid: questionUuid!,
  sql: choice?.body ?? "",
  error_message: errorMessage,
});
```

헤더 표시 변경:

```typescript
// old
<span className="font-mono text-xs text-text-caption">Q{String(questionId).padStart(3, "0")}</span>
<span className="badge-topic">{question.topicCode}</span>

// new
<span className="font-mono text-xs text-text-caption">{questionUuid?.slice(0, 8)}</span>
<span className="badge-topic">{question.topicName}</span>
```

- [ ] **Step 4: Questions.tsx — UUID 링크 + 필드명 변경**

```typescript
// old
{data?.content.map((q) => (
  <Link key={q.id} to={`/questions/${q.id}`} className="block">
    <div className="card-base ...">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-caption">Q{String(q.id).padStart(3, "0")}</span>
        <span className="badge-topic">{q.topicCode}</span>
      </div>
      ...
    </div>
  </Link>
))}

// new
{data?.content.map((q) => (
  <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`} className="block">
    <div className="card-base ...">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-caption">{q.questionUuid.slice(0, 8)}</span>
        <span className="badge-topic">{q.topicName}</span>
      </div>
      ...
    </div>
  </Link>
))}
```

- [ ] **Step 5: Stats.tsx — heatmap 제거 + ProgressResponse 필드 반영**

```typescript
// old
import { useProgress, useHeatmap } from "../hooks/useProgress";

// new
import { useProgress } from "../hooks/useProgress";
```

`useHeatmap` 호출, `heatmapGrid` 변수, `{heatmapGrid}` 렌더링 모두 제거.

Progress 필드 변경:

```typescript
// old
{ value: String(progress?.solved ?? 0), label: "푼 문제" },
{ value: `${Math.round(progress?.correctRate ?? 0)}%`, label: "정답률" },

// new
{ value: String(progress?.solvedCount ?? 0), label: "푼 문제" },
{ value: `${Math.round((progress?.correctRate ?? 0) * 100)}%`, label: "정답률" },
```

`getHeatmapStyle` 함수, `useMemo` import도 삭제.

- [ ] **Step 6: AnswerFeedback.tsx — UUID 전환**

FeedbackState 인터페이스 변경:

```typescript
// old
interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionId: number;
}

// new
interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
}
```

diffExplain 호출 변경:

```typescript
// old
diffMutation.mutate({
  questionId: state.questionId,
  selectedKey: state.selectedKey,
});

// new
diffMutation.mutate({
  question_id: 0, // questionUuid 기반 시스템에서 백엔드가 UUID로 조회하므로 0 전달 (api-guide 참조: 프론트는 question_id, selected_key만 전달)
  selected_key: state.selectedKey,
});
```

참고: `diffExplain`의 body는 api-guide 기준 `question_id`(integer) + `selected_key`(string)이다. UUID 전환 시 이 필드도 변경이 필요할 수 있으나, 현재 be-api-docs.json에서 body 스키마가 `additionalProperties: object`로만 정의되어 있어 기존 필드를 유지한다. 백엔드와 확인 필요.

- [ ] **Step 7: 커밋**

```bash
git add src/App.tsx src/pages/Home.tsx src/pages/QuestionDetail.tsx src/pages/Questions.tsx src/pages/Stats.tsx src/pages/AnswerFeedback.tsx
git commit -m "refactor: 페이지/라우터 UUID 전환 + heatmap 제거 #35"
```

---

### Task 9: 빌드 검증 + mock-data 테스트

**Files:**
- Modify: `src/api/mock-data.test.ts` (타입 에러 수정)

- [ ] **Step 1: 빌드 확인**

Run: `npm run build 2>&1 | tail -20`
Expected: 빌드 성공 또는 mock-data.test.ts에서 타입 에러

- [ ] **Step 2: mock-data.test.ts 타입 에러 수정**

테스트 파일에서 구 필드명(`id`, `topicCode`, `solved`, `ProgressSummary` 등) 참조가 있으면 새 필드명으로 변경. 구체적 수정은 빌드 에러 메시지 기반으로 진행.

- [ ] **Step 3: 테스트 실행**

Run: `npx vitest run 2>&1 | tail -30`
Expected: 모든 테스트 통과

- [ ] **Step 4: 빌드 최종 확인**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "fix: 빌드 에러 수정 + 테스트 통과 확인 #35"
```
