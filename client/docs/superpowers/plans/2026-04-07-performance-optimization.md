# Performance Optimization (HIGH + MEDIUM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** vercel-react-best-practices 룰 기반으로 불필요한 리렌더를 제거하고, 콜백 안정성을 확보하고, 공용 컴포넌트를 추출한다.

**Architecture:** StarRating을 공용 컴포넌트로 추출(DRY). QuestionDetail의 useCallback 의존성을 functional setState 패턴으로 최적화. 선택지 카드를 React.memo로 분리. AiExplanationSheet의 마크다운 파서를 useMemo로 캐시. Stats 히트맵 그리드를 useMemo로 메모이제이션.

**Tech Stack:** React 19 (memo, useMemo, useCallback, useRef), TypeScript

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/StarRating.tsx` | 공용 난이도 별점 컴포넌트 (React.memo) |
| Create | `src/components/ChoiceCard.tsx` | 선택지 카드 컴포넌트 (React.memo) |
| Modify | `src/pages/QuestionDetail.tsx` | 콜백 최적화 + ChoiceCard 사용 |
| Modify | `src/pages/Questions.tsx` | 중복 StarRating 제거 → 공용 import |
| Modify | `src/components/AiExplanationSheet.tsx` | renderMarkdown useMemo |
| Modify | `src/pages/Stats.tsx` | 히트맵 그리드 useMemo |

---

### Task 1: StarRating 공용 컴포넌트 추출

**Files:**
- Create: `src/components/StarRating.tsx`
- Modify: `src/pages/Questions.tsx`
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: `src/components/StarRating.tsx` 생성**

```tsx
import { memo } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  readonly level: number;
}

export const StarRating = memo(function StarRating({ level }: StarRatingProps) {
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
});
```

- [ ] **Step 2: Questions.tsx에서 로컬 StarRating 삭제, 공용 import로 교체**

`import { StarRating } from "../components/StarRating";` 추가.
파일 상단의 `function StarRating` 정의(7~19줄)와 `Star` import 삭제.

- [ ] **Step 3: QuestionDetail.tsx에서 동일하게 교체**

`import { StarRating } from "../components/StarRating";` 추가.
파일 상단의 `function StarRating` 정의(7~19줄)와 `Star` import 삭제.

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/StarRating.tsx src/pages/Questions.tsx src/pages/QuestionDetail.tsx
git commit -m "refactor: StarRating 공용 컴포넌트 추출 + React.memo 적용 #13"
```

---

### Task 2: QuestionDetail 콜백 최적화 + ChoiceCard 분리

**Files:**
- Create: `src/components/ChoiceCard.tsx`
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: `src/components/ChoiceCard.tsx` 생성**

선택지 카드를 React.memo로 분리. props가 변경되지 않으면 리렌더 스킵.

```tsx
import { memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { ChoiceItem, ExecuteResult } from "../types/api";

interface ChoiceCardProps {
  readonly choice: ChoiceItem;
  readonly isSelected: boolean;
  readonly cached: ExecuteResult | undefined;
  readonly isExecutable: boolean;
  readonly isExecuting: boolean;
  readonly onSelect: (key: string) => void;
  readonly onExecute: (key: string) => void;
}

export const ChoiceCard = memo(function ChoiceCard({
  choice,
  isSelected,
  cached,
  isExecutable,
  isExecuting,
  onSelect,
  onExecute,
}: ChoiceCardProps) {
  const borderClass = isSelected ? "border-brand border-2" : "border-border";

  return (
    <div className={`card-base ${borderClass}`}>
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          className={`radio-custom ${isSelected ? "radio-custom--selected" : ""}`}
          onClick={() => onSelect(choice.key)}
          aria-label={`선택지 ${choice.key}`}
        />
        <span className="text-body font-bold">{choice.key}</span>
      </div>

      <pre className="code-block text-sm">
        <code>{choice.body}</code>
      </pre>

      {isExecutable && (
        <div className="flex justify-end mt-2">
          <button
            className="btn-compact"
            type="button"
            onClick={() => onExecute(choice.key)}
            disabled={!!cached || isExecuting}
          >
            {isExecuting ? "실행 중..." : "실행"}
          </button>
        </div>
      )}

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
});
```

- [ ] **Step 2: QuestionDetail.tsx 리팩토링 — 콜백 최적화 + ChoiceCard 사용**

핵심 변경:
1. `handleExecute`: `executeCache`를 의존성에서 제거. `useRef`로 캐시 참조하거나, functional setState + 조건 체크.
2. `handleSelect`: 동일하게 의존성 최소화.
3. 선택지 렌더링을 `ChoiceCard` 컴포넌트로 교체.

```tsx
import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import { useQuestionDetail, useExecuteChoice, useSubmitAnswer } from "../hooks/useQuestionDetail";
import type { ExecuteResult } from "../types/api";

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
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;

  const handleExecute = useCallback((choiceKey: string) => {
    if (executeCacheRef.current[choiceKey]) return;
    executeMutation.mutate(choiceKey, {
      onSuccess: (result) => {
        setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
      },
    });
  }, [executeMutation]);

  const handleSelect = useCallback((choiceKey: string) => {
    setSelectedKey(choiceKey);
    if (!executeCacheRef.current[choiceKey]) {
      handleExecute(choiceKey);
    }
  }, [handleExecute]);

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question) return;
    submitMutation.mutate(selectedKey, {
      onSuccess: (result) => {
        const selectedChoice = question.choices.find((c) => c.key === selectedKey);
        const correctChoice = question.choices.find((c) => c.key === result.correctKey);
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
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button type="button" className="text-text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-topic">{question.topicCode}</span>
          <StarRating level={question.difficulty} />
        </div>
      </header>

      <section className="card-base mt-4">
        <p className="text-body">{question.stem}</p>
      </section>

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

      <section className="mt-4 space-y-3">
        {question.choices.map((choice) => (
          <ChoiceCard
            key={choice.key}
            choice={choice}
            isSelected={selectedKey === choice.key}
            cached={executeCache[choice.key]}
            isExecutable={question.executionMode === "EXECUTABLE"}
            isExecuting={executeMutation.isPending && executeMutation.variables === choice.key}
            onSelect={handleSelect}
            onExecute={handleExecute}
          />
        ))}
      </section>

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

**최적화 효과:**
- `handleExecute`: `executeCache` 의존성 제거 → `useRef`로 최신값 참조 → 콜백 안정
- `handleSelect`: `executeCache` 의존성 제거 → `handleExecute`만 의존
- 선택지 카드: `React.memo` → selectedKey 변경 시 변경된 카드 2개만 리렌더 (이전 선택 + 새 선택)

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/ChoiceCard.tsx src/pages/QuestionDetail.tsx
git commit -m "perf: QuestionDetail 콜백 최적화 + ChoiceCard React.memo 분리 #13"
```

---

### Task 3: AiExplanationSheet 마크다운 useMemo + Stats 히트맵 useMemo

**Files:**
- Modify: `src/components/AiExplanationSheet.tsx`
- Modify: `src/pages/Stats.tsx`

- [ ] **Step 1: AiExplanationSheet.tsx — renderMarkdown을 useMemo로 캐시**

`renderMarkdown` 호출을 `useMemo`로 감싸서 `text` 변경 시에만 재파싱.

현재 `renderMarkdown(MOCK_EXPLANATION)`을 다음으로 교체:

import에 `useMemo` 추가 (`useState, useEffect, useMemo`).

컴포넌트 내부에서:
```tsx
const renderedContent = useMemo(
  () => (loading ? null : renderMarkdown(MOCK_EXPLANATION)),
  [loading],
);
```

JSX에서:
```tsx
{loading ? <LoadingSkeleton /> : renderedContent}
```

- [ ] **Step 2: Stats.tsx — 히트맵 그리드를 useMemo로 메모이제이션**

import에 `useMemo` 추가.

히트맵 렌더링을 useMemo로 감싸서 progress 데이터 변경 시 히트맵 리렌더 방지:

```tsx
import { useMemo } from "react";
import { useProgress, useHeatmap } from "../hooks/useProgress";

// getHeatmapStyle 함수는 그대로 유지

export default function Stats() {
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap();

  const heatmapGrid = useMemo(() => {
    if (heatmapLoading || !heatmap || heatmap.length === 0) return null;
    return (
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
    );
  }, [heatmap, heatmapLoading]);

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
      {heatmapGrid}
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/AiExplanationSheet.tsx src/pages/Stats.tsx
git commit -m "perf: AiExplanationSheet 마크다운 useMemo + Stats 히트맵 useMemo #13"
```
