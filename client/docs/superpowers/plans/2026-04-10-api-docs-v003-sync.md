# API Docs v0.0.3 → 코드 동기화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `be-api-docs.json` v0.0.3 기준으로 신규 API 엔드포인트와 타입 변경사항을 프론트엔드 코드에 반영

**Architecture:** 타입 정의(api.ts) → API 함수(progress.ts) → 목 데이터(mock-data.ts) → 문서(api-guide.md) 순서로 업데이트. 기존 코드를 최대한 보존하고 신규/변경 사항만 추가.

**Tech Stack:** TypeScript, React 19, Vite, Zustand

---

## 변경 사항 요약

### 신규 API 엔드포인트
| 엔드포인트 | 함수 | 응답 타입 |
|-----------|------|---------|
| `GET /progress/topic-analysis?memberUuid` | `fetchTopicAnalysis()` | `TopicAnalysisResponse` |
| `GET /progress/ai-comment?memberUuid` | `fetchAiComment()` | `AiCommentResponse` |

### 타입 변경
- `SubmitResult`: `selectedSql?: string`, `correctSql?: string` 필드 추가
- 신규 타입: `TopicAnalysisResponse`, `TopicStat`, `AiCommentResponse`

### 상태 변경
- `GET /progress/heatmap`: "미구현" → 정식 구현 완료 (api-guide.md 업데이트)

---

## File Structure

**수정 파일:**
- `src/types/api.ts` — 타입 추가/수정
- `src/api/progress.ts` — 신규 API 함수 추가
- `src/api/mock-data.ts` — 신규 목 데이터 추가
- `.claude/rules/api-guide.md` — 문서 업데이트

---

### Task 1: 타입 정의 업데이트 (src/types/api.ts)

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: SubmitResult에 신규 필드 추가**

`src/types/api.ts`의 `SubmitResult` 인터페이스에 두 필드를 추가한다:

```typescript
// 변경 전
export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult?: ExecuteResult;
  readonly correctResult?: ExecuteResult;
}

// 변경 후
export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedSql?: string;      // EXECUTABLE 문제 — 사용자가 선택한 선택지의 SQL
  readonly correctSql?: string;       // EXECUTABLE 문제 — 정답 선택지의 SQL
  readonly selectedResult?: ExecuteResult;
  readonly correctResult?: ExecuteResult;
}
```

- [ ] **Step 2: 신규 타입 추가 (TopicStat, TopicAnalysisResponse, AiCommentResponse)**

`src/types/api.ts`의 `// === Progress ===` 섹션 끝 (CategoryStats 아래)에 추가:

```typescript
export interface TopicStat {
  readonly topicUuid: string;
  readonly displayName: string;
  readonly totalQuestionCount: number;
  readonly correctRate: number;
  readonly solvedCount: number;
}

export interface TopicAnalysisResponse {
  readonly topicStats: readonly TopicStat[];
}

export interface AiCommentResponse {
  readonly comment: string;
  readonly generatedAt: string;
}
```

- [ ] **Step 3: 타입 컴파일 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
git add src/types/api.ts
git commit -m "feat: SubmitResult 신규 필드 추가, TopicAnalysis/AiComment 타입 정의 #71"
```

---

### Task 2: API 함수 추가 (src/api/progress.ts)

**Files:**
- Modify: `src/api/progress.ts`

- [ ] **Step 1: import에 신규 타입 추가**

`src/api/progress.ts` 상단의 import를 수정:

```typescript
// 변경 전
import type { ProgressResponse, HeatmapResponse, CategoryStats } from "../types/api";

// 변경 후
import type {
  ProgressResponse,
  HeatmapResponse,
  CategoryStats,
  TopicAnalysisResponse,
  AiCommentResponse,
} from "../types/api";
```

- [ ] **Step 2: fetchTopicAnalysis 함수 추가**

`fetchCategoryStats` 함수 아래에 추가:

```typescript
// 토픽별 정답률/문제수 분석 (#71)
export function fetchTopicAnalysis(): Promise<TopicAnalysisResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/topic-analysis?memberUuid=${uuid}`);
}
```

- [ ] **Step 3: fetchAiComment 함수 추가**

`fetchTopicAnalysis` 함수 아래에 추가:

```typescript
// AI 영역 분석 코멘트 (Redis 캐시 24h, #71)
export function fetchAiComment(): Promise<AiCommentResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/ai-comment?memberUuid=${uuid}`);
}
```

- [ ] **Step 4: 완성된 progress.ts 확인**

파일 전체가 다음과 같아야 한다:

```typescript
import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  ProgressResponse,
  HeatmapResponse,
  CategoryStats,
  TopicAnalysisResponse,
  AiCommentResponse,
} from "../types/api";

export function fetchProgress(): Promise<ProgressResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress?memberUuid=${uuid}`);
}

export function fetchCategoryStats(): Promise<readonly CategoryStats[]> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/categories?memberUuid=${uuid}`);
}

export function fetchHeatmap(memberUuid: string, from?: string, to?: string): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  query.set("memberUuid", memberUuid);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiFetch(`/progress/heatmap?${query}`);
}

// 토픽별 정답률/문제수 분석 (#71)
export function fetchTopicAnalysis(): Promise<TopicAnalysisResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/topic-analysis?memberUuid=${uuid}`);
}

// AI 영역 분석 코멘트 (Redis 캐시 24h, #71)
export function fetchAiComment(): Promise<AiCommentResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/progress/ai-comment?memberUuid=${uuid}`);
}
```

- [ ] **Step 5: 타입 컴파일 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
git add src/api/progress.ts
git commit -m "feat: fetchTopicAnalysis, fetchAiComment API 함수 추가 #71"
```

---

### Task 3: 목 데이터 업데이트 (src/api/mock-data.ts)

**Files:**
- Modify: `src/api/mock-data.ts`

- [ ] **Step 1: import에 신규 타입 추가**

`src/api/mock-data.ts` 상단의 import에 추가:

```typescript
// 기존 import에 TopicAnalysisResponse, AiCommentResponse 추가
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
  ChoiceItem,
  HeatmapResponse,
  CategoryStats,
  TopicAnalysisResponse,
  AiCommentResponse,
} from "../types/api";
```

- [ ] **Step 2: MOCK_TOPIC_ANALYSIS 상수 추가**

`MOCK_CATEGORY_STATS` 상수 정의 아래에 추가 (MOCK_TOPICS를 재사용):

```typescript
// TopicAnalysis 목 데이터 — /progress/topic-analysis 응답
const MOCK_TOTAL_Q_POOL = [28, 35, 15, 22, 18, 41, 10, 25, 8];
const MOCK_TOPIC_ANALYSIS: TopicAnalysisResponse = {
  topicStats: MOCK_TOPICS.map((t, i) => ({
    topicUuid: t.topicUuid,
    displayName: t.displayName,
    totalQuestionCount: MOCK_TOTAL_Q_POOL[i % MOCK_TOTAL_Q_POOL.length],
    correctRate: MOCK_RATE_POOL[i % MOCK_RATE_POOL.length],
    solvedCount: MOCK_SOLVED_POOL[i % MOCK_SOLVED_POOL.length],
  })),
};
```

- [ ] **Step 3: MOCK_AI_COMMENT 상수 추가**

`MOCK_TOPIC_ANALYSIS` 상수 아래에 추가:

```typescript
// AiComment 목 데이터 — /progress/ai-comment 응답
const MOCK_AI_COMMENT: AiCommentResponse = {
  comment:
    "SELECT 기본과 GROUP BY 영역에서 정답률이 높지만, DDL/DML/TCL 영역은 최근 7일 정답률이 41%로 취약합니다. JOIN 패턴과 서브쿼리 위주로 집중 학습을 추천합니다.",
  generatedAt: "2026-04-10T10:00:00",
};
```

- [ ] **Step 4: getMockResponse에 새 경로 핸들러 추가**

`getMockResponse` 함수 내 `/progress/categories` 핸들러 위에 두 핸들러를 추가한다:

기존 코드에서:
```typescript
  // GET /progress/categories (specific before /progress)
  if (method === "GET" && path.startsWith("/progress/categories")) {
    return MOCK_CATEGORY_STATS;
  }
```

이 앞에 추가:
```typescript
  // GET /progress/topic-analysis (specific before /progress)
  if (method === "GET" && path.startsWith("/progress/topic-analysis")) {
    return MOCK_TOPIC_ANALYSIS satisfies TopicAnalysisResponse;
  }

  // GET /progress/ai-comment (specific before /progress)
  if (method === "GET" && path.startsWith("/progress/ai-comment")) {
    return MOCK_AI_COMMENT satisfies AiCommentResponse;
  }
```

- [ ] **Step 5: SubmitResult 목 데이터에 selectedSql/correctSql 추가**

`getMockResponse`의 `/submit` 핸들러에서 EXECUTABLE 분기를 수정:

```typescript
// 기존
if (executionMode === "EXECUTABLE") {
  return {
    ...baseResult,
    selectedResult: isCorrect ? MOCK_CORRECT_EXECUTE_RESULT : MOCK_WRONG_EXECUTE_RESULT,
    correctResult: MOCK_CORRECT_EXECUTE_RESULT,
  } satisfies SubmitResult;
}

// 변경 후
if (executionMode === "EXECUTABLE") {
  return {
    ...baseResult,
    selectedSql: isCorrect
      ? "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.customer_id = o.customer_id GROUP BY c.name"
      : "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.cust_id = o.cust_id GROUP BY c.name",
    correctSql:
      "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.customer_id = o.customer_id GROUP BY c.name",
    selectedResult: isCorrect ? MOCK_CORRECT_EXECUTE_RESULT : MOCK_WRONG_EXECUTE_RESULT,
    correctResult: MOCK_CORRECT_EXECUTE_RESULT,
  } satisfies SubmitResult;
}
```

- [ ] **Step 6: 타입 컴파일 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음

- [ ] **Step 7: 기존 목 데이터 테스트 통과 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx vitest run src/api/mock-data.test.ts 2>&1
```

Expected: 모든 테스트 PASS

- [ ] **Step 8: 커밋**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
git add src/api/mock-data.ts
git commit -m "feat: topic-analysis/ai-comment 목 데이터 추가, SubmitResult selectedSql/correctSql 추가 #71"
```

---

### Task 4: api-contract 테스트 추가 (src/api/api-contract.test.ts)

**Files:**
- Modify: `src/api/api-contract.test.ts`

- [ ] **Step 1: 기존 api-contract 테스트 파일 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx vitest run src/api/api-contract.test.ts 2>&1 | tail -20
```

Expected: 모든 테스트 PASS (기존 테스트가 깨지지 않는지 확인)

- [ ] **Step 2: fetchTopicAnalysis 테스트 추가**

`src/api/api-contract.test.ts`에 기존 `fetchHeatmap` 테스트 아래에 추가:

```typescript
describe("fetchTopicAnalysis — GET /progress/topic-analysis", () => {
  it("memberUuid를 query param으로 전송", async () => {
    const { fetchTopicAnalysis } = await import("./progress");
    vi.mocked(apiFetch).mockResolvedValue({ topicStats: [] });

    await fetchTopicAnalysis();

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/progress/topic-analysis?memberUuid=")
    );
  });
});

describe("fetchAiComment — GET /progress/ai-comment", () => {
  it("memberUuid를 query param으로 전송", async () => {
    const { fetchAiComment } = await import("./progress");
    vi.mocked(apiFetch).mockResolvedValue({ comment: "test", generatedAt: "2026-04-10T00:00:00" });

    await fetchAiComment();

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/progress/ai-comment?memberUuid=")
    );
  });
});
```

- [ ] **Step 3: 테스트 실행 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npx vitest run src/api/api-contract.test.ts 2>&1 | tail -20
```

Expected: 신규 2개 포함 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
git add src/api/api-contract.test.ts
git commit -m "test: fetchTopicAnalysis, fetchAiComment 컨트랙트 테스트 추가 #71"
```

---

### Task 5: api-guide.md 문서 업데이트

**Files:**
- Modify: `.claude/rules/api-guide.md`

- [ ] **Step 1: Progress 섹션 테이블 업데이트**

`.claude/rules/api-guide.md`의 Progress 섹션에서 다음 변경:

**1) fetchHeatmap 상태 "미구현" → "O"로 변경:**
```markdown
| `fetchHeatmap(memberUuid, from?, to?)` | GET | `/progress/heatmap?memberUuid&from&to` | O (query param) | `HeatmapResponse` | O |
```

**2) fetchTopicAnalysis, fetchAiComment 행 추가:**
```markdown
| `fetchTopicAnalysis()` | GET | `/progress/topic-analysis?memberUuid` | O (query param) | `TopicAnalysisResponse` | O |
| `fetchAiComment()` | GET | `/progress/ai-comment?memberUuid` | O (query param) | `AiCommentResponse` | O |
```

- [ ] **Step 2: fetchProgress 설명에 SubmitResult 변경 반영**

Questions 섹션의 `submitAnswer` 설명에 추가:
```
- `submitAnswer`: EXECUTABLE 문제는 `SubmitResult`에 `selectedSql`, `correctSql`, `selectedResult`, `correctResult` 포함. CONCEPT_ONLY 문제는 `isCorrect`, `correctKey`, `rationale`만 반환.
```

- [ ] **Step 3: fetchTopicAnalysis, fetchAiComment 설명 추가**

Progress 섹션 설명에 추가:
```
- `fetchTopicAnalysis`: 토픽별 정답률/문제수 분석. `TopicAnalysisResponse { topicStats: TopicStat[] }`. `TopicStat { topicUuid, displayName, totalQuestionCount, correctRate, solvedCount }`. Submission 없는 토픽도 correctRate=0.0, solvedCount=0으로 포함.
- `fetchAiComment`: AI 생성 약점 분석 코멘트. Redis 캐시 24h TTL. 새 Submission 저장 시 캐시 무효화. AI 호출 latency 고려해 비동기 로딩 권장.
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
git add .claude/rules/api-guide.md
git commit -m "docs: api-guide.md Progress 섹션 신규 엔드포인트 반영, heatmap 상태 업데이트 #71"
```

---

## Self-Review

### Spec Coverage
- [x] `SubmitResult.selectedSql / correctSql` 추가 — Task 1
- [x] `TopicAnalysisResponse / TopicStat / AiCommentResponse` 타입 — Task 1
- [x] `fetchTopicAnalysis()` API 함수 — Task 2
- [x] `fetchAiComment()` API 함수 — Task 2
- [x] topic-analysis 목 데이터 — Task 3
- [x] ai-comment 목 데이터 — Task 3
- [x] SubmitResult 목 데이터 selectedSql/correctSql — Task 3
- [x] API contract 테스트 — Task 4
- [x] api-guide.md 문서 업데이트 — Task 5

### Placeholder Check
- 모든 코드 블록은 실제 구현 코드를 포함
- 타입, 함수명, 경로 일관성 확인

### Type Consistency
- `TopicStat`은 Task 1에서 정의, Task 2/3에서 import하여 사용
- `AiCommentResponse`는 Task 1에서 정의, Task 2/3에서 import하여 사용
- `SubmitResult.selectedSql / correctSql`은 Task 1에서 추가, Task 3 목 데이터에서 사용
