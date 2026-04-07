# API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 7개 화면의 mock 상수 데이터를 실제 백엔드 API(`be-api-docs.json` v0.0.3)로 교체한다. TanStack Query 훅으로 데이터 페칭을 통일하고, 선택지 실행 캐시, 에러 처리, 라우팅 연결을 구현한다.

**Architecture:** `src/hooks/` 디렉토리에 TanStack Query 기반 커스텀 훅을 생성한다. 각 페이지는 mock 상수를 제거하고 해당 훅의 반환값으로 렌더링한다. API 함수(`src/api/`)는 이미 작성되어 있으므로 훅에서 호출만 하면 된다. 미구현 API(members, today, recent-wrong)는 호출부에서 에러 시 graceful fallback 처리한다.

**Tech Stack:** TanStack React Query v5, React Router DOM v7, 기존 `apiFetch<T>()` 래퍼

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/hooks/useProgress.ts` | progress + heatmap 조회 훅 |
| Create | `src/hooks/useQuestions.ts` | 문제 목록 조회 훅 (필터 + 페이지네이션) |
| Create | `src/hooks/useQuestionDetail.ts` | 문제 상세 조회 + 선택지 실행 캐시 + submit 훅 |
| Create | `src/hooks/useTopics.ts` | 토픽 목록 조회 훅 |
| Modify | `src/pages/Home.tsx` | mock → useProgress 훅 |
| Modify | `src/pages/Questions.tsx` | mock → useQuestions + useTopics + Link 라우팅 |
| Modify | `src/pages/QuestionDetail.tsx` | mock → useQuestionDetail + execute + submit |
| Modify | `src/pages/AnswerFeedback.tsx` | navigate state에서 submitResult 수신 |
| Modify | `src/pages/Stats.tsx` | mock → useProgress + useHeatmap |
| Modify | `src/pages/Settings.tsx` | mock → memberStore UUID + clipboard API |

---

### Task 1: useProgress 훅 + Home 페이지 연동

**Files:**
- Create: `src/hooks/useProgress.ts`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: `src/hooks/useProgress.ts` 생성**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchProgress, fetchHeatmap } from "../api/progress";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 0,
  });
}

export function useHeatmap() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: fetchHeatmap,
    staleTime: 1000 * 60 * 5,
  });
}
```

- [ ] **Step 2: Home.tsx에서 mock 제거, useProgress 연동**

mock 상수 전부 제거. `useProgress` 훅으로 교체. 로딩/에러 상태 처리.

```tsx
import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMemberStore } from "../stores/memberStore";

export default function Home() {
  const { data: progress, isLoading } = useProgress();
  const uuid = useMemberStore((s) => s.uuid);
  const initials = uuid.slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-10 w-48 rounded bg-border animate-pulse" />
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-border animate-pulse" />
          <div className="h-24 rounded-xl bg-border animate-pulse" />
        </div>
      </div>
    );
  }

  const solved = progress?.solved ?? 0;
  const correctRate = progress?.correctRate ?? 0;
  const streak = progress?.streakDays ?? 0;

  return (
    <div className="py-6 space-y-0">
      {/* 1. Greeting */}
      <section className="flex items-center gap-3 mb-8">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {initials}
        </div>
        <h1 className="text-h2">안녕하세요, {uuid.slice(0, 8)}</h1>
      </section>

      {/* 2. 스트릭 뱃지 */}
      {streak > 0 && (
        <section className="mb-6">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-sem-warning-light)",
              color: "var(--color-sem-warning-text)",
            }}
          >
            <Flame size={16} className="inline" /> 연속 {streak}일
          </span>
        </section>
      )}

      {/* 3. 문제 풀기 카드 */}
      <section className="mb-4">
        <Link to="/questions">
          <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-secondary mb-1">문제 풀기</p>
              <p className="text-body">SQL 문제를 풀어보세요</p>
            </div>
            <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
          </div>
        </Link>
      </section>

      {/* 4. 통계 카드 2개 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{solved}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>

        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{Math.round(correctRate)}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${correctRate}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
```

**변경 요약:**
- "오늘의 문제" 카드 → "문제 풀기" Link (today API 미구현이므로)
- 닉네임 → UUID 앞 8자리 (members API 미구현이므로)
- 스트릭 0이면 뱃지 숨김
- 로딩 시 skeleton UI

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useProgress.ts src/pages/Home.tsx
git commit -m "feat: Home 페이지 API 연동 (progress 훅) #13"
```

---

### Task 2: useTopics + useQuestions 훅 + Questions 페이지 연동

**Files:**
- Create: `src/hooks/useTopics.ts`
- Create: `src/hooks/useQuestions.ts`
- Modify: `src/pages/Questions.tsx`

- [ ] **Step 1: `src/hooks/useTopics.ts` 생성**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchTopics } from "../api/meta";

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: fetchTopics,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 2: `src/hooks/useQuestions.ts` 생성**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchQuestions } from "../api/questions";

interface UseQuestionsParams {
  readonly page?: number;
  readonly size?: number;
  readonly topic?: string;
  readonly difficulty?: number;
}

export function useQuestions(params: UseQuestionsParams = {}) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => fetchQuestions(params),
    staleTime: 1000 * 30,
  });
}
```

- [ ] **Step 3: Questions.tsx에서 mock 제거, 훅 연동 + Link 라우팅**

mock 상수 전부 제거. `useQuestions`로 교체. 카드에 `Link to={/questions/${id}}` 추가. 필터는 `useState`로 관리하되 API 파라미터로 전달. `useTopics`로 토픽 목록 드롭다운 옵션 채움. 페이지네이션은 "더 보기" → page increment.

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight, ChevronDown } from "lucide-react";
import { useQuestions } from "../hooks/useQuestions";
import { useTopics } from "../hooks/useTopics";

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? "fill-[var(--color-sem-warning)] text-[var(--color-sem-warning)]" : "text-border"}
        />
      ))}
    </span>
  );
}

export default function Questions() {
  const [page, setPage] = useState(0);
  const [topic, setTopic] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<number | undefined>();
  const [topicOpen, setTopicOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: topics } = useTopics();
  const { data, isLoading } = useQuestions({ page, size: 10, topic, difficulty });

  return (
    <div className="py-6 space-y-0">
      {/* 1. Filter bar */}
      <section className="flex gap-3 mb-4 relative">
        <div className="relative">
          <button
            className={`filter-dropdown ${topic ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => { setTopicOpen(!topicOpen); setDiffOpen(false); }}
          >
            {topic ?? "토픽"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {topicOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                onClick={() => { setTopic(undefined); setTopicOpen(false); setPage(0); }}
              >
                전체
              </button>
              {topics?.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                  onClick={() => { setTopic(t.code); setTopicOpen(false); setPage(0); }}
                >
                  {t.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className={`filter-dropdown ${difficulty ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => { setDiffOpen(!diffOpen); setTopicOpen(false); }}
          >
            {difficulty ? `난이도 ${difficulty}` : "난이도"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {diffOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
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
                  {"★".repeat(d)}{"☆".repeat(3 - d)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Result count */}
      <p className="text-secondary mb-4">
        {isLoading ? "로딩 중..." : `${data?.totalElements ?? 0}문제`}
      </p>

      {/* 3. Question card list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-base h-24 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          {data?.content.map((q) => (
            <Link key={q.id} to={`/questions/${q.id}`}>
              <div className="card-base flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-caption">Q{String(q.id).padStart(3, "0")}</span>
                  <span className="badge-topic">{q.topicCode}</span>
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

      {/* 4. Pagination */}
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

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTopics.ts src/hooks/useQuestions.ts src/pages/Questions.tsx
git commit -m "feat: 문제 목록 API 연동 (필터, 페이지네이션, 라우팅) #13"
```

---

### Task 3: useQuestionDetail 훅 + QuestionDetail 페이지 연동

**Files:**
- Create: `src/hooks/useQuestionDetail.ts`
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: `src/hooks/useQuestionDetail.ts` 생성**

문제 상세 조회 + 선택지 execute mutation + submit mutation + 실행 결과 로컬 캐시.

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer } from "../api/questions";
import type { ExecuteResult, SubmitResult } from "../types/api";

export function useQuestionDetail(id: number) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: () => fetchQuestion(id),
    staleTime: 0,
  });
}

export function useExecuteChoice(questionId: number) {
  return useMutation({
    mutationFn: (choiceKey: string) => executeChoice(questionId, choiceKey),
  });
}

export function useSubmitAnswer(questionId: number) {
  return useMutation({
    mutationFn: (selectedKey: string) => submitAnswer(questionId, selectedKey),
  });
}
```

- [ ] **Step 2: QuestionDetail.tsx에서 mock 제거, 훅 연동**

핵심 변경:
- `useQuestionDetail(id)` → 문제 데이터
- `useExecuteChoice(id)` → 선택지 클릭 시 자동 execute
- `executeCache: Record<string, ExecuteResult>` → 로컬 state로 캐시, 재호출 방지
- `useSubmitAnswer(id)` → 제출 → navigate to result with state
- 선택지 카드에서 `choice.body`를 SQL로 렌더링 (kind가 SQL일 때)

```tsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Check, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useQuestionDetail, useExecuteChoice, useSubmitAnswer } from "../hooks/useQuestionDetail";
import type { ExecuteResult } from "../types/api";

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? "fill-[var(--color-sem-warning)] text-[var(--color-sem-warning)]" : "text-border"}
        />
      ))}
    </span>
  );
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const questionId = Number(id);
  const navigate = useNavigate();

  const { data: question, isLoading } = useQuestionDetail(questionId);
  const executeMutation = useExecuteChoice(questionId);
  const submitMutation = useSubmitAnswer(questionId);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});

  const handleExecute = useCallback((choiceKey: string) => {
    if (executeCache[choiceKey]) return;
    executeMutation.mutate(choiceKey, {
      onSuccess: (result) => {
        setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
      },
    });
  }, [executeCache, executeMutation]);

  const handleSelect = useCallback((choiceKey: string) => {
    setSelectedKey(choiceKey);
    if (!executeCache[choiceKey]) {
      handleExecute(choiceKey);
    }
  }, [executeCache, handleExecute]);

  const handleSubmit = useCallback(() => {
    if (!selectedKey) return;
    submitMutation.mutate(selectedKey, {
      onSuccess: (result) => {
        const selectedChoice = question?.choices.find((c) => c.key === selectedKey);
        const correctChoice = question?.choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionId}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionId,
          },
        });
      },
    });
  }, [selectedKey, submitMutation, question, questionId, navigate]);

  if (isLoading || !question) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-14 bg-border animate-pulse rounded" />
        <div className="h-24 bg-border animate-pulse rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-40 bg-border animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ── 1. Sticky Header ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button type="button" className="text-text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-topic">{question.topicCode}</span>
          <StarRating level={question.difficulty} />
        </div>
      </header>

      {/* ── 2. Stem Card ── */}
      <section className="card-base mt-4">
        <p className="text-body">{question.stem}</p>
      </section>

      {/* ── 3. Schema Card ── */}
      {question.schemaDisplay && (
        <section className="mt-3">
          <button
            type="button"
            className="flex items-center gap-2 text-secondary text-sm w-full"
            onClick={() => setSchemaOpen((prev) => !prev)}
          >
            <span>스키마 보기</span>
            {schemaOpen ? <ChevronUp size={16} className="text-text-caption" /> : <ChevronDown size={16} className="text-text-caption" />}
          </button>
          {schemaOpen && (
            <pre className="code-block mt-2">
              <code>{question.schemaDisplay}</code>
            </pre>
          )}
        </section>
      )}

      {/* ── 4. Choice Cards ── */}
      <section className="mt-4 space-y-3">
        {question.choices.map((choice) => {
          const isSelected = selectedKey === choice.key;
          const borderClass = isSelected ? "border-brand border-2" : "border-border";
          const cached = executeCache[choice.key];

          return (
            <div key={choice.key} className={`card-base ${borderClass}`}>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  className={`radio-custom ${isSelected ? "radio-custom--selected" : ""}`}
                  onClick={() => handleSelect(choice.key)}
                  aria-label={`선택지 ${choice.key}`}
                />
                <span className="text-body font-bold">{choice.key}</span>
              </div>

              <pre className="code-block text-sm">
                <code>{choice.body}</code>
              </pre>

              {question.executionMode === "EXECUTABLE" && (
                <div className="flex justify-end mt-2">
                  <button
                    className="btn-compact"
                    type="button"
                    onClick={() => handleExecute(choice.key)}
                    disabled={!!cached || executeMutation.isPending}
                  >
                    {executeMutation.isPending && executeMutation.variables === choice.key ? "실행 중..." : "실행"}
                  </button>
                </div>
              )}

              {/* SUCCESS */}
              {cached && !cached.errorCode && (
                <div className="success-card mt-3">
                  <p className="text-sm font-medium" style={{ color: "var(--color-sem-success-text)" }}>
                    <Check size={14} className="inline" /> {cached.rowCount}행 · {cached.elapsedMs}ms
                  </p>
                  {cached.columns.length > 0 && (
                    <table className="data-table mt-2">
                      <thead>
                        <tr>
                          {cached.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cached.rows.map((row, i) => (
                          <tr key={i}>
                            {(row as unknown[]).map((cell, j) => (
                              <td key={j}>{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ERROR */}
              {cached?.errorCode && (
                <div className="error-card mt-3">
                  <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
                    <AlertTriangle size={14} className="inline" /> {cached.errorCode}
                  </span>
                  <p className="text-secondary mt-1">{cached.errorMessage}</p>
                  <div className="flex justify-end mt-2">
                    <button className="text-brand text-sm font-medium" type="button">
                      AI에게 물어보기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── 5. Sticky Submit ── */}
      <div className="fixed bottom-0 inset-x-0 lg:left-55 bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-body font-bold ${
              selectedKey && !submitMutation.isPending
                ? "bg-brand text-white"
                : "bg-border text-text-caption cursor-not-allowed"
            }`}
            disabled={!selectedKey || submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? "제출 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useQuestionDetail.ts src/pages/QuestionDetail.tsx
git commit -m "feat: 문제 상세 API 연동 (execute 캐시, submit → result 이동) #13"
```

---

### Task 4: AnswerFeedback 페이지 — navigate state 수신

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: AnswerFeedback.tsx에서 mock 제거, location.state에서 SubmitResult 수신**

QuestionDetail에서 `navigate(path, { state: { ...submitResult, selectedKey, selectedSql, correctSql, questionId } })`로 전달한 데이터를 수신한다. state가 없으면 /questions로 redirect.

```tsx
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X } from "lucide-react";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionId: number;
}

export default function AnswerFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FeedbackState | null;

  if (!state) {
    navigate("/questions", { replace: true });
    return null;
  }

  const { isCorrect, correctKey, rationale, selectedKey, selectedSql, correctSql } = state;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-180 w-full px-4 pb-24">
        {isCorrect ? (
          <>
            <div className="text-center pt-12 pb-8">
              <div
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#DCFCE7" }}
              >
                <Check size={36} style={{ color: "var(--color-sem-success-text)" }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-success-text)" }}>
                정답입니다!
              </h1>
              <p className="text-secondary mt-2">잘했어요! 다음 문제도 도전해보세요</p>
            </div>
            <div className="card-base">
              <p className="text-secondary text-sm mb-3">해설</p>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                  style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
                >
                  {correctKey}
                </span>
              </div>
              {correctSql && (
                <pre
                  className="rounded-lg p-4 text-sm font-mono leading-relaxed mb-4"
                  style={{
                    backgroundColor: "var(--color-sem-success-light)",
                    borderLeft: "4px solid var(--color-sem-success)",
                  }}
                >
                  <code>{correctSql}</code>
                </pre>
              )}
              <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
                {rationale}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center pt-12 pb-8">
              <div
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <X size={36} style={{ color: "var(--color-sem-error-text)" }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-error-text)" }}>
                오답입니다
              </h1>
              <p className="text-secondary mt-2">괜찮아요, 해설을 확인해보세요</p>
            </div>
            <div className="card-base space-y-0">
              {selectedSql && (
                <div
                  className="rounded-lg p-4 mb-4"
                  style={{
                    backgroundColor: "var(--color-sem-error-light)",
                    borderLeft: "4px solid var(--color-sem-error)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">내가 선택한 답</span>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                      style={{ backgroundColor: "#FEE2E2", color: "var(--color-sem-error-text)" }}
                    >
                      {selectedKey}
                    </span>
                  </div>
                  <pre className="text-sm font-mono leading-relaxed">
                    <code>{selectedSql}</code>
                  </pre>
                </div>
              )}
              {correctSql && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "var(--color-sem-success-light)",
                    borderLeft: "4px solid var(--color-sem-success)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">정답</span>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                      style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
                    >
                      {correctKey}
                    </span>
                  </div>
                  <pre className="text-sm font-mono leading-relaxed">
                    <code>{correctSql}</code>
                  </pre>
                </div>
              )}
              <p className="text-body leading-relaxed mt-4" style={{ color: "#374151" }}>
                {rationale}
              </p>
            </div>
          </>
        )}
      </div>

      <div
        className="fixed bottom-0 inset-x-0 p-4 z-20"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
        }}
      >
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className="w-full h-[52px] rounded-lg text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => navigate("/questions")}
          >
            다음 문제
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AnswerFeedback.tsx
git commit -m "feat: 결과 화면 API 연동 (navigate state에서 submitResult 수신) #13"
```

---

### Task 5: Stats 페이지 API 연동

**Files:**
- Modify: `src/pages/Stats.tsx`

- [ ] **Step 1: Stats.tsx에서 mock 제거, useProgress + useHeatmap 연동**

```tsx
import { ChevronRight } from "lucide-react";
import { useProgress, useHeatmap } from "../hooks/useProgress";

function getHeatmapStyle(rate: number): { bg: string; text: string } {
  if (rate >= 86) return { bg: "#4F46E5", text: "#FFFFFF" };
  if (rate >= 71) return { bg: "#818CF8", text: "#FFFFFF" };
  if (rate >= 51) return { bg: "#C7D2FE", text: "#4F46E5" };
  if (rate >= 31) return { bg: "#EEF2FF", text: "#4F46E5" };
  return { bg: "#F5F5F5", text: "#6B7280" };
}

export default function Stats() {
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap();

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-48 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* 1. Summary */}
      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: String(progress?.solved ?? 0), label: "푼 문제" },
          { value: `${Math.round(progress?.correctRate ?? 0)}%`, label: "정답률" },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* 2. Heatmap */}
      {!heatmapLoading && heatmap && heatmap.length > 0 && (
        <section>
          <h2 className="text-h2 mb-4">토픽별 숙련도</h2>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
            {heatmap.map((t) => {
              const style = getHeatmapStyle(t.correctRate);
              return (
                <div
                  key={t.topicCode}
                  className="rounded-lg min-h-[48px] flex flex-col items-center justify-center py-2 px-1"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  <span className="text-[13px] font-bold">{t.topicName}</span>
                  <span className="text-xs">{Math.round(t.correctRate)}%</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Stats.tsx
git commit -m "feat: 통계 화면 API 연동 (progress + heatmap) #13"
```

---

### Task 6: Settings 페이지 — memberStore + clipboard

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Settings.tsx에서 mock 제거, memberStore UUID 사용 + clipboard 복사**

```tsx
import { Copy, RefreshCw } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";

export default function Settings() {
  const uuid = useMemberStore((s) => s.uuid);
  const truncatedUuid = uuid.slice(0, 20) + "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
  };

  return (
    <div className="py-6">
      <div className="card-base p-0">
        {/* 디바이스 ID */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">디바이스 ID</p>
            <p className="font-mono text-[13px] text-text-primary mt-1">{truncatedUuid}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            title="복사"
            onClick={handleCopy}
          >
            <Copy size={16} />
          </button>
        </div>

        {/* 닉네임 — members API 미구현, UUID 앞 8자리 표시 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">닉네임</p>
            <p className="text-body font-bold mt-1">{uuid.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption opacity-50 cursor-not-allowed"
            title="재생성 (미구현)"
            disabled
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* 버전 */}
        <div className="px-5 py-4">
          <p className="text-secondary text-sm">버전</p>
          <p className="text-caption text-sm mt-1">1.0.0-MVP</p>
        </div>
      </div>

      <div className="text-center mt-8 space-y-1">
        <p className="text-[13px]" style={{ color: "#D1D5DB" }}>passQL</p>
        <p className="text-xs" style={{ color: "#D1D5DB" }}>Powered by Vite + React</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: 설정 화면 API 연동 (memberStore UUID, clipboard 복사) #13"
```
