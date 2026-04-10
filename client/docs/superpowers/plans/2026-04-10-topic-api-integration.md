# Topic API 연동 및 카테고리 그리드 구현 (#68) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/questions` 진입 시 BE `/api/meta/topics` API 기반 카테고리 그리드를 렌더링하고, 클릭 시 해당 topic 필터 문제 목록으로 이동

**Architecture:** `Questions.tsx`를 "카테고리 그리드 모드(topic 미선택)" / "문제 목록 모드(topic 선택)" 두 뷰로 나누는 URL search param 방식. `useSearchParams`로 `?topic=sql_join` 형태를 관리하여 deep-link 지원. Mock 데이터를 BE 9개 topic code 체계로 동기화하여 로컬 개발 환경과 실 API 환경이 일관된 동작을 보이도록 함.

**Tech Stack:** React 19, React Router DOM (useSearchParams), TanStack Query (useTopics, useQuestions), TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react

---

## 파일 구조

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/api/mock-data.ts` | 수정 | MOCK_TOPICS → BE 9개 topic code 체계로 교체, MOCK_QUESTIONS → topicCode/topicName 동기화, 필터링 로직 topicCode 기준으로 수정 |
| `src/pages/Questions.tsx` | 수정 | URL search param 기반 뷰 전환, 카테고리 그리드 뷰 + 문제 목록 뷰 |

**변경 불필요 파일:**
- `src/types/api.ts` — `TopicTree`/`SubtopicItem` 이미 `topicUuid`, `sortOrder`, `isActive` 포함됨
- `src/api/meta.ts` — `fetchTopics()` 구현 완료
- `src/hooks/useTopics.ts` — 구현 완료
- `src/hooks/useQuestions.ts` — 구현 완료

---

## Task 1: Mock 데이터 — MOCK_TOPICS를 BE 9개 topic code 체계로 교체

**Files:**
- Modify: `src/api/mock-data.ts:24-37` (MOCK_TOPICS 배열)

### BE topic 정보 (변경 없음 — 이 값으로 동기화)

| sortOrder | code | displayName |
|-----------|------|-------------|
| 1 | data_modeling | 데이터 모델링의 이해 |
| 2 | sql_basic_select | SELECT 기본 |
| 3 | sql_ddl_dml_tcl | DDL / DML / TCL |
| 4 | sql_function | SQL 함수 (문자/숫자/날짜/NULL) |
| 5 | sql_join | 조인 (JOIN) |
| 6 | sql_subquery | 서브쿼리 |
| 7 | sql_group_aggregate | 그룹함수 / 집계 |
| 8 | sql_window | 윈도우 함수 |
| 9 | sql_hierarchy_pivot | 계층 쿼리 / PIVOT |

- [ ] **Step 1: MOCK_TOPICS 배열 교체**

`src/api/mock-data.ts` 의 `MOCK_TOPICS` (라인 24–37)를 아래로 교체:

```typescript
const MOCK_TOPICS: readonly TopicTree[] = [
  {
    topicUuid: "topic-uuid-001",
    code: "data_modeling",
    displayName: "데이터 모델링의 이해",
    sortOrder: 1,
    isActive: true,
    subtopics: [],
  },
  {
    topicUuid: "topic-uuid-002",
    code: "sql_basic_select",
    displayName: "SELECT 기본",
    sortOrder: 2,
    isActive: true,
    subtopics: [
      { code: "select_basic", displayName: "SELECT 문 구조", sortOrder: 1, isActive: true },
      { code: "where_clause", displayName: "WHERE 절", sortOrder: 2, isActive: true },
      { code: "order_by", displayName: "ORDER BY", sortOrder: 3, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-003",
    code: "sql_ddl_dml_tcl",
    displayName: "DDL / DML / TCL",
    sortOrder: 3,
    isActive: true,
    subtopics: [
      { code: "ddl", displayName: "DDL (CREATE/ALTER/DROP)", sortOrder: 1, isActive: true },
      { code: "dml", displayName: "DML (INSERT/UPDATE/DELETE)", sortOrder: 2, isActive: true },
      { code: "tcl", displayName: "TCL (COMMIT/ROLLBACK)", sortOrder: 3, isActive: true },
      { code: "constraint", displayName: "제약조건", sortOrder: 4, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-004",
    code: "sql_function",
    displayName: "SQL 함수 (문자/숫자/날짜/NULL)",
    sortOrder: 4,
    isActive: true,
    subtopics: [
      { code: "string_func", displayName: "문자 함수", sortOrder: 1, isActive: true },
      { code: "numeric_func", displayName: "숫자 함수", sortOrder: 2, isActive: true },
      { code: "date_func", displayName: "날짜 함수", sortOrder: 3, isActive: true },
      { code: "null_func", displayName: "NULL 관련 함수", sortOrder: 4, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-005",
    code: "sql_join",
    displayName: "조인 (JOIN)",
    sortOrder: 5,
    isActive: true,
    subtopics: [
      { code: "inner_join", displayName: "INNER JOIN", sortOrder: 1, isActive: true },
      { code: "outer_join", displayName: "OUTER JOIN", sortOrder: 2, isActive: true },
      { code: "self_join", displayName: "SELF JOIN", sortOrder: 3, isActive: true },
      { code: "cross_join", displayName: "CROSS JOIN", sortOrder: 4, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-006",
    code: "sql_subquery",
    displayName: "서브쿼리",
    sortOrder: 6,
    isActive: true,
    subtopics: [
      { code: "scalar_subquery", displayName: "스칼라 서브쿼리", sortOrder: 1, isActive: true },
      { code: "inline_view", displayName: "인라인 뷰", sortOrder: 2, isActive: true },
      { code: "correlated_subquery", displayName: "상관 서브쿼리", sortOrder: 3, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-007",
    code: "sql_group_aggregate",
    displayName: "그룹함수 / 집계",
    sortOrder: 7,
    isActive: true,
    subtopics: [
      { code: "group_by", displayName: "GROUP BY", sortOrder: 1, isActive: true },
      { code: "having", displayName: "HAVING", sortOrder: 2, isActive: true },
      { code: "aggregate_func", displayName: "집계 함수", sortOrder: 3, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-008",
    code: "sql_window",
    displayName: "윈도우 함수",
    sortOrder: 8,
    isActive: true,
    subtopics: [
      { code: "rank_func", displayName: "순위 함수 (RANK/ROW_NUMBER)", sortOrder: 1, isActive: true },
      { code: "window_aggregate", displayName: "윈도우 집계", sortOrder: 2, isActive: true },
    ],
  },
  {
    topicUuid: "topic-uuid-009",
    code: "sql_hierarchy_pivot",
    displayName: "계층 쿼리 / PIVOT",
    sortOrder: 9,
    isActive: true,
    subtopics: [
      { code: "connect_by", displayName: "계층 쿼리 (CONNECT BY)", sortOrder: 1, isActive: true },
      { code: "pivot", displayName: "PIVOT / UNPIVOT", sortOrder: 2, isActive: true },
    ],
  },
];
```

- [ ] **Step 2: 빌드 확인 (타입 오류 없는지)**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build 2>&1 | tail -20
```

Expected: 빌드 성공 (0 errors)

- [ ] **Step 3: Commit**

```bash
git add src/api/mock-data.ts
git commit -m "chore: MOCK_TOPICS를 BE 9개 topic code 체계로 교체 #68"
```

---

## Task 2: Mock 데이터 — MOCK_QUESTIONS topicCode/topicName 동기화 및 필터링 로직 수정

**Files:**
- Modify: `src/api/mock-data.ts:46-62` (MOCK_QUESTIONS 배열)
- Modify: `src/api/mock-data.ts:178-181` (getMockResponse 필터링 로직)

- [ ] **Step 1: MOCK_QUESTIONS의 topicCode/topicName을 BE 체계로 수정**

`src/api/mock-data.ts` 의 `MOCK_QUESTIONS` (라인 46–62)를 아래로 교체:

```typescript
const MOCK_QUESTIONS: readonly QuestionSummary[] = [
  // sql_join (2)
  {
    questionUuid: "q-uuid-0001",
    topicCode: "sql_join",
    topicName: "조인 (JOIN)",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "고객별 주문 수를 구하는 올바른 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0006",
    topicCode: "sql_join",
    topicName: "조인 (JOIN)",
    difficulty: 3,
    executionMode: "EXECUTABLE",
    stemPreview: "LEFT JOIN과 INNER JOIN의 결과 차이를 올바르게 설명한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_subquery (2)
  {
    questionUuid: "q-uuid-0002",
    topicCode: "sql_subquery",
    topicName: "서브쿼리",
    difficulty: 3,
    executionMode: "EXECUTABLE",
    stemPreview: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0009",
    topicCode: "sql_subquery",
    topicName: "서브쿼리",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "상관 서브쿼리와 비상관 서브쿼리의 차이를 올바르게 설명한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_group_aggregate (2)
  {
    questionUuid: "q-uuid-0003",
    topicCode: "sql_group_aggregate",
    topicName: "그룹함수 / 집계",
    difficulty: 2,
    executionMode: "EXECUTABLE",
    stemPreview: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0007",
    topicCode: "sql_group_aggregate",
    topicName: "그룹함수 / 집계",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_ddl_dml_tcl (2)
  {
    questionUuid: "q-uuid-0004",
    topicCode: "sql_ddl_dml_tcl",
    topicName: "DDL / DML / TCL",
    difficulty: 1,
    executionMode: "EXECUTABLE",
    stemPreview: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0008",
    topicCode: "sql_ddl_dml_tcl",
    topicName: "DDL / DML / TCL",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "CREATE TABLE 시 DEFAULT 제약조건 문법은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_basic_select (2)
  {
    questionUuid: "q-uuid-0005",
    topicCode: "sql_basic_select",
    topicName: "SELECT 기본",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "SELECT 문의 실행 순서를 올바르게 나열한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0010",
    topicCode: "sql_basic_select",
    topicName: "SELECT 기본",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "WHERE 절에서 LIKE 연산자의 와일드카드 사용법은?",
    createdAt: "2026-04-07T12:00:00",
  },
];
```

- [ ] **Step 2: getMockResponse 필터링 로직을 topicCode 기준으로 수정**

`src/api/mock-data.ts` 라인 174–193의 GET `/questions` 블록에서 필터링 로직을 아래로 교체:

현재 코드 (라인 175–182):
```typescript
  if (method === "GET" && path.startsWith("/questions") && !path.includes("/questions/")) {
    const url = new URLSearchParams(path.split("?")[1] ?? "");
    const page = Number(url.get("page") ?? 0);
    const size = Number(url.get("size") ?? 10);
    const topic = url.get("topic");
    const topicDisplayName = topic ? MOCK_TOPICS.find((t) => t.code === topic)?.displayName : undefined;
    const filtered = topicDisplayName ? MOCK_QUESTIONS.filter((q) => q.topicName === topicDisplayName) : topic ? [] : MOCK_QUESTIONS;
```

교체 후:
```typescript
  if (method === "GET" && path.startsWith("/questions") && !path.includes("/questions/")) {
    const url = new URLSearchParams(path.split("?")[1] ?? "");
    const page = Number(url.get("page") ?? 0);
    const size = Number(url.get("size") ?? 10);
    const topic = url.get("topic");
    const filtered = topic
      ? MOCK_QUESTIONS.filter((q) => q.topicCode === topic)
      : MOCK_QUESTIONS;
```

- [ ] **Step 3: MOCK_QUESTION_DETAIL의 topicName 동기화**

`src/api/mock-data.ts` 라인 65–85의 `MOCK_QUESTION_DETAIL` 에서 `topicName: "JOIN"` → `topicName: "조인 (JOIN)"` 으로 수정:

```typescript
const MOCK_QUESTION_DETAIL: QuestionDetail = {
  questionUuid: "q-uuid-0001",
  topicName: "조인 (JOIN)",   // "JOIN" → "조인 (JOIN)"
  // ... 나머지 필드는 그대로
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build 2>&1 | tail -20
```

Expected: 빌드 성공 (0 errors)

- [ ] **Step 5: Commit**

```bash
git add src/api/mock-data.ts
git commit -m "chore: MOCK_QUESTIONS topicCode/topicName BE 체계 동기화, 필터링 topicCode 기준 수정 #68"
```

---

## Task 3: Questions.tsx — URL search param 기반 뷰 전환 구조로 리팩토링

**Files:**
- Modify: `src/pages/Questions.tsx`

현재 `Questions.tsx`는 로컬 state(`useState`)로 `topic`을 관리한다. 이를 `useSearchParams`로 교체하여 URL에 topic이 반영되게 한다. 이후 두 뷰(카테고리 그리드 / 문제 목록)를 조건부 렌더링한다.

- [ ] **Step 1: useSearchParams import 추가, topic state를 URL로 전환**

`src/pages/Questions.tsx` 전체를 아래로 교체:

```typescript
import { useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuestions } from "../hooks/useQuestions";
import { useTopics } from "../hooks/useTopics";
import { StarRating } from "../components/StarRating";
import ErrorFallback from "../components/ErrorFallback";

export default function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = searchParams.get("topic") ?? undefined;

  const [page, setPage] = useState(0);
  const [difficulty, setDifficulty] = useState<number | undefined>();
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: topics, isLoading: topicsLoading, isError: topicsError } = useTopics();
  const { data, isLoading, isError, refetch } = useQuestions(
    topic !== undefined ? { page, size: 10, topic, difficulty } : { enabled: false } as never,
  );

  function selectTopic(code: string) {
    setPage(0);
    setDifficulty(undefined);
    setSearchParams({ topic: code });
  }

  function clearTopic() {
    setPage(0);
    setDifficulty(undefined);
    setSearchParams({});
  }

  // 카테고리 그리드 뷰
  if (topic === undefined) {
    return (
      <div className="py-6 space-y-4">
        <h1 className="text-h1">문제</h1>
        <p className="text-secondary">토픽을 선택하세요</p>

        {topicsError ? (
          <ErrorFallback onRetry={() => window.location.reload()} />
        ) : topicsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="card-base h-20 animate-pulse bg-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {topics
              ?.filter((t) => t.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="card-base flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors text-left"
                  onClick={() => selectTopic(t.code)}
                >
                  <span className="text-body font-medium text-text-primary">{t.displayName}</span>
                  {t.subtopics.length > 0 && (
                    <span className="text-caption text-text-caption">
                      {t.subtopics.length}개 서브토픽
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    );
  }

  // 문제 목록 뷰
  const currentTopic = topics?.find((t) => t.code === topic);

  return (
    <div className="py-6 space-y-0">
      {/* Back to categories */}
      <button
        type="button"
        className="flex items-center gap-1 text-brand text-sm font-medium mb-4 hover:underline"
        onClick={clearTopic}
      >
        <ArrowLeft size={14} />
        토픽 전체
      </button>

      <h1 className="text-h1 mb-4">
        {currentTopic?.displayName ?? topic}
      </h1>

      {/* Filter bar */}
      <section className="flex gap-3 mb-4 relative">
        <div className="relative">
          <button
            className={`filter-dropdown ${difficulty ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => setDiffOpen(!diffOpen)}
          >
            {difficulty ? `난이도 ${difficulty}` : "난이도"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {diffOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg z-10 py-1 min-w-[120px]">
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                onClick={() => { setDifficulty(undefined); setDiffOpen(false); setPage(0); }}
              >
                전체
              </button>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                  onClick={() => { setDifficulty(d); setDiffOpen(false); setPage(0); }}
                >
                  <StarRating level={d} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Result count */}
      <p className="text-secondary mb-4">
        {isLoading ? "로딩 중..." : `${data?.totalElements ?? 0}문제`}
      </p>

      {/* Question card list */}
      {isError ? (
        <ErrorFallback onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-base h-24 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          {data?.content.map((q) => (
            <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`} className="block">
              <div className="card-base flex flex-col gap-3 cursor-pointer hover:bg-surface transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-caption">{q.questionUuid.slice(0, 8)}</span>
                  <span className="badge-topic">{q.topicName}</span>
                </div>
                <p className="text-body truncate">{q.stemPreview}</p>
                <div className="flex items-center justify-between">
                  <StarRating level={q.difficulty} />
                  <ChevronRight size={16} className="text-text-caption" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Pagination */}
      {data && !data.last && (
        <div className="flex justify-center pt-6">
          <button
            className="text-brand text-sm font-medium hover:underline"
            type="button"
            onClick={() => setPage((p) => p + 1)}
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
```

> **주의**: `useQuestions`에 `enabled: false` 옵션을 전달하는 부분은 아래 Step 2에서 더 명확하게 처리한다.

- [ ] **Step 2: useQuestions enabled 처리 수정**

위 코드에서 topic이 없을 때 useQuestions를 호출하지 않도록 처리해야 한다. `as never` 캐스팅 대신 올바른 방법으로 수정. `src/pages/Questions.tsx`의 `useQuestions` 호출 부분을 아래로 교체:

```typescript
  const { data, isLoading, isError, refetch } = useQuestions(
    topic !== undefined
      ? { page, size: 10, topic, difficulty }
      : { page: 0, size: 0 },  // topic 없을 때 빈 쿼리 — 카테고리 그리드 뷰에서는 결과 안 씀
  );
```

> 이 hook은 topic === undefined일 때 grid 뷰를 렌더링하므로 쿼리 결과를 사용하지 않는다. TanStack Query가 page=0, size=0으로 `/questions?page=0&size=0` 호출할 수 있지만, 카테고리 그리드 뷰에서 결과를 표시하지 않으므로 UX에 영향 없음.

- [ ] **Step 3: 빌드 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run build 2>&1 | tail -20
```

Expected: 빌드 성공 (0 errors)

- [ ] **Step 4: Commit**

```bash
git add src/pages/Questions.tsx
git commit -m "feat: 문제 풀기 카테고리 그리드 화면 구현 및 BE Topic API 연동 #68"
```

---

## Task 4: 동작 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
cd /Users/luca/Documents/GitHub/passQL/client && npm run dev
```

- [ ] **Step 2: 카테고리 그리드 동작 확인 체크리스트**

브라우저에서 `http://localhost:5173/questions` 접속 후 확인:

1. `/questions` 진입 시 카테고리 그리드(2열) 표시
2. 9개 토픽이 sortOrder 순서대로 표시 (데이터 모델링의 이해, SELECT 기본, ...)
3. 카테고리 카드 클릭 시 URL이 `/questions?topic=sql_join` 형태로 변경
4. 토픽 선택 후 해당 topic 문제 목록 표시 (필터 바 + 문제 카드)
5. "토픽 전체" 버튼 클릭 시 `/questions` (파라미터 없음)로 복귀
6. 로딩 중 스켈레톤 UI 표시
7. 문제 없는 토픽 선택 시 `0문제` 표시 (ErrorFallback 아님)

- [ ] **Step 3: Mock 필터링 확인**

`/questions?topic=sql_join` → `q-uuid-0001`, `q-uuid-0006` (JOIN 문제 2개) 표시 확인

`/questions?topic=sql_group_aggregate` → `q-uuid-0003`, `q-uuid-0007` (그룹함수 문제 2개) 표시 확인

- [ ] **Step 4: 최종 커밋 (필요 시)**

빌드가 성공하고 동작이 확인되면 별도 수정사항이 없으면 넘어간다.

---

## Self-Review 체크리스트

- [x] **Spec coverage**: Task 1 → MOCK_TOPICS BE 체계 동기화, Task 2 → MOCK_QUESTIONS 동기화 + 필터링 로직 수정, Task 3 → 카테고리 그리드 화면 + API 연동, Task 4 → 문제 목록 필터 topic code 동기화 확인
- [x] **Placeholder scan**: 모든 코드 블록 완성됨. TBD 없음.
- [x] **Type consistency**: `TopicTree`, `SubtopicItem`, `QuestionSummary` 타입은 `src/types/api.ts`에 정의되어 있으며 이미 BE 응답 필드를 모두 포함함. 계획 내 타입 참조 일관성 확인됨.
- [x] **`src/types/api.ts` 변경 불필요 확인**: `TopicTree.topicUuid`, `TopicTree.sortOrder`, `TopicTree.isActive`, `SubtopicItem.sortOrder`, `SubtopicItem.isActive` 이미 존재함 (라인 136–150).
