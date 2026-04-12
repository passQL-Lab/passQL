# EXECUTABLE 결과 화면 UI/UX 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EXECUTABLE 문제 정답 제출 후 결과 화면에서 comparisonSection + ChoiceReview를 선택지 카드 4개 통합 목록으로 재구성하고, ResultTable 스타일을 SchemaViewer와 통일한다.

**Architecture:** AnswerFeedback.tsx 내 EXECUTABLE 분기를 재설계 — comparisonSection/ChoiceReview 제거, 선택지별 카드 목록 도입. 제출 응답에서 받은 selectedResult/correctResult를 초기 캐시로 활용해 정답·내 선택 카드는 즉시 결과 표시. ResultTable은 SchemaViewer 스타일(행 구분선 + rounded border)로 통일.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react

---

## 파일 변경 범위

| 파일 | 작업 |
|------|------|
| `src/styles/components.css` | `.data-table tr` 행 구분선 추가 |
| `src/components/ResultTable.tsx` | 테이블 컨테이너에 rounded border 추가 |
| `src/pages/AnswerFeedback.tsx` | EXECUTABLE 분기 전면 재구성 |
| `src/components/ChoiceReview.tsx` | import 제거 (파일 삭제는 별도 사용자 승인 필요) |

---

## Task 1: ResultTable 스타일 개선

**Files:**
- Modify: `src/styles/components.css`
- Modify: `src/components/ResultTable.tsx`

### 목표
`data-table` 행에 구분선 추가, 테이블 컨테이너에 SchemaViewer와 동일한 `rounded-xl border` 스타일 적용.

- [ ] **Step 1: CSS 행 구분선 추가**

`src/styles/components.css`의 `.data-table` 섹션을 아래와 같이 수정:

```css
/* ── 6. Data Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 8px 12px;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.data-table td {
  padding: 8px 12px;
  height: 36px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.data-table tr {
  border-bottom: 1px solid var(--color-border);
}

.data-table tr:last-child {
  border-bottom: none;
}

.data-table tr:nth-child(even) {
  background-color: var(--color-surface-zebra);
}
```

- [ ] **Step 2: ResultTable 컨테이너 스타일 추가**

`src/components/ResultTable.tsx`의 성공 케이스 테이블 래퍼 div를 수정:

```tsx
// 수정 전
{result.columns.length > 0 && (
  <div className="overflow-x-auto">
    <table className="data-table w-full">

// 수정 후
{result.columns.length > 0 && (
  <div
    className="overflow-x-auto rounded-xl border mt-2"
    style={{ borderColor: "var(--color-border)" }}
  >
    <table className="data-table w-full">
```

- [ ] **Step 3: 기존 테스트 통과 확인**

```bash
npm run test -- --reporter=verbose src/components/ResultTable.test.tsx
```

기대 결과: 4개 테스트 모두 PASS (CSS 클래스 추가는 기존 동작 변경 없음)

- [ ] **Step 4: 커밋**

```bash
git add src/styles/components.css src/components/ResultTable.tsx
git commit -m "style: ResultTable 행 구분선 및 테이블 컨테이너 border 추가 #144"
```

---

## Task 2: AnswerFeedback EXECUTABLE 결과 화면 재구조화

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`

### 목표
- `SqlCompareBlock`, `TextCompareBlock` 로컬 컴포넌트 제거
- `comparisonSection` 제거
- EXECUTABLE 분기: 선택지 카드 목록으로 교체 (정답·내 선택 카드 초기 캐시 포함)
- 해설(rationale) + AI 버튼을 별도 카드로 분리
- `ChoiceReview` import 제거

- [ ] **Step 1: `AnswerFeedback.tsx` 전체 교체**

`src/pages/AnswerFeedback.tsx`를 아래 내용으로 교체:

```tsx
import { useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import { executeChoice } from "../api/questions";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { ResultTable } from "../components/ResultTable";
import { useSimilarQuestions } from "../hooks/useSimilarQuestions";
import type { ChoiceItem, ExecuteResult, ExecutionMode } from "../types/api";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql: string | null;
  readonly correctSql: string | null;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult: ExecuteResult | null;
  readonly correctResult: ExecuteResult | null;
  readonly isDailyChallenge?: boolean;
  readonly choices?: readonly ChoiceItem[];
}

export default function AnswerFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FeedbackState | null;

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const diffMutation = useMutation({
    mutationFn: diffExplain,
    onSuccess: (result) => setAiText(result.text),
  });
  const similarQuery = useSimilarQuestions(state?.questionUuid ?? "");

  // 선택지 SQL 실행 결과 캐시 — 제출 응답(selectedResult/correctResult)으로 초기화
  const [resultCache, setResultCache] = useState<Record<string, ExecuteResult>>(() => {
    if (!state) return {};
    const cache: Record<string, ExecuteResult> = {};
    if (state.selectedResult && state.selectedKey) {
      cache[state.selectedKey] = state.selectedResult;
    }
    if (state.correctResult && state.correctKey) {
      cache[state.correctKey] = state.correctResult;
    }
    return cache;
  });
  const [executing, setExecuting] = useState<string | null>(null);
  const [execErrors, setExecErrors] = useState<Record<string, string>>({});

  const handleExecute = useCallback(async (choice: ChoiceItem) => {
    if (!state || resultCache[choice.key] || executing === choice.key) return;
    setExecErrors((prev) => { const next = { ...prev }; delete next[choice.key]; return next; });
    setExecuting(choice.key);
    try {
      const result = await executeChoice(state.questionUuid, choice.body);
      setResultCache((prev) => ({ ...prev, [choice.key]: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "실행에 실패했습니다";
      setExecErrors((prev) => ({ ...prev, [choice.key]: message }));
    } finally {
      setExecuting(null);
    }
  }, [state, resultCache, executing]);

  const handleAskAi = () => {
    if (!state) return;
    setAiSheetOpen(true);
    setAiText("");
    diffMutation.mutate({
      questionUuid: state.questionUuid,
      selectedChoiceKey: state.selectedKey,
    });
  };

  if (!state) {
    navigate("/questions", { replace: true });
    return null;
  }

  const {
    isCorrect,
    rationale,
    selectedSql,
    correctSql,
    executionMode,
    selectedResult,
    correctResult,
    isDailyChallenge,
    choices,
    selectedKey,
    correctKey,
  } = state;

  const isExecutable = executionMode === "EXECUTABLE";
  const sqlChoices = isExecutable
    ? (choices ?? []).filter((c) => c.kind === "SQL")
    : [];

  // ── 정답/오답 헤더 ──────────────────────────────────────
  const headerSection = (
    <div className="text-center pt-12 pb-8">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: isCorrect ? "#DCFCE7" : "#FEE2E2" }}
      >
        {isCorrect ? (
          <Check size={36} style={{ color: "var(--color-sem-success-text)" }} />
        ) : (
          <X size={36} style={{ color: "var(--color-sem-error-text)" }} />
        )}
      </div>
      <h1
        className="text-2xl font-bold"
        style={{
          color: isCorrect
            ? "var(--color-sem-success-text)"
            : "var(--color-sem-error-text)",
        }}
      >
        {isCorrect ? "정답입니다!" : "오답이에요"}
      </h1>
      <p className="text-secondary mt-2">
        {isCorrect
          ? "정확히 맞혔어요! 다음 문제도 도전해보세요"
          : "오답이에요. 해설을 확인해보세요"}
      </p>
    </div>
  );

  // ── CONCEPT_ONLY: 기존 텍스트 비교 카드 (변경 없음) ────
  const conceptSection = !isExecutable ? (
    <div className="card-base">
      {!isCorrect && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: "var(--color-sem-error-light)",
            borderLeft: "4px solid var(--color-sem-error)",
          }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-sem-error-text)" }}>
            내가 선택한 답
          </p>
          {selectedSql && <p className="text-body text-sm">{selectedSql}</p>}
        </div>
      )}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--color-sem-success-light)",
          borderLeft: "4px solid var(--color-sem-success)",
        }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-sem-success-text)" }}>
          정답
        </p>
        {correctSql && <p className="text-body text-sm">{correctSql}</p>}
      </div>
    </div>
  ) : null;

  // ── 해설 카드 ────────────────────────────────────────────
  const rationaleSection = (
    <div className="card-base mt-4">
      <p className="text-secondary text-sm mb-2">해설</p>
      <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
        {rationale}
      </p>
      {!isCorrect && (
        <button className="btn-primary w-full mt-4" type="button" onClick={handleAskAi}>
          AI에게 자세히 물어보기
        </button>
      )}
    </div>
  );

  // ── EXECUTABLE: 선택지 카드 목록 ─────────────────────────
  const choiceListSection = isExecutable && sqlChoices.length > 0 ? (
    <section className="mt-6 space-y-3">
      <p className="text-secondary text-sm">SQL 실행 비교</p>
      {sqlChoices.map((choice) => {
        const isAnswer = choice.key === correctKey;
        const isMyChoice = choice.key === selectedKey;
        const cached = resultCache[choice.key];
        const isRunning = executing === choice.key;
        const error = execErrors[choice.key];

        // 카드 스타일 결정
        let borderColor = "var(--color-border)";
        let bgColor = "var(--color-surface-card)";
        let badgeText: string | null = null;
        let badgeStyle: React.CSSProperties = {};

        if (isAnswer && isMyChoice) {
          borderColor = "var(--color-sem-success)";
          bgColor = "var(--color-sem-success-light)";
          badgeText = "정답 · 내 선택";
          badgeStyle = { backgroundColor: "var(--color-sem-success-light)", color: "var(--color-sem-success-text)" };
        } else if (isAnswer) {
          borderColor = "var(--color-sem-success)";
          bgColor = "var(--color-sem-success-light)";
          badgeText = "정답";
          badgeStyle = { backgroundColor: "var(--color-sem-success-light)", color: "var(--color-sem-success-text)" };
        } else if (isMyChoice) {
          borderColor = "var(--color-brand)";
          bgColor = "var(--color-brand-light)";
          badgeText = "내 선택";
          badgeStyle = { backgroundColor: "var(--color-brand-light)", color: "var(--color-brand)" };
        }

        return (
          <div
            key={choice.key}
            className="rounded-xl p-4"
            style={{
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
            }}
          >
            {/* 선택지 키 + 상태 뱃지 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                {choice.key}
              </span>
              {badgeText && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={badgeStyle}>
                  {badgeText}
                </span>
              )}
            </div>

            {/* SQL 본문 */}
            <pre
              className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word mb-3"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
            >
              {choice.body}
            </pre>

            {/* 실행 버튼 또는 에러 */}
            {error ? (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm" style={{ color: "var(--color-sem-error)" }}>{error}</p>
                <button type="button" className="btn-compact" onClick={() => handleExecute(choice)}>
                  재시도
                </button>
              </div>
            ) : !cached ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-compact"
                  onClick={() => handleExecute(choice)}
                  disabled={isRunning}
                >
                  {isRunning ? "실행 중..." : "실행"}
                </button>
              </div>
            ) : null}

            {/* 실행 결과 */}
            {cached && <ResultTable result={cached} />}
          </div>
        );
      })}
    </section>
  ) : null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-180 w-full px-4 pb-24">
        {headerSection}
        {conceptSection}
        {rationaleSection}
        {choiceListSection}

        {similarQuery.data && similarQuery.data.length > 0 && (
          <section className="mt-6">
            <h2 className="text-secondary text-sm mb-3">유사 문제</h2>
            <div className="space-y-2">
              {similarQuery.data.map((q) => (
                <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`}>
                  <div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-body truncate">{q.stem}</p>
                      <span className="badge-topic">{q.topicName}</span>
                    </div>
                    <ChevronRight size={16} className="text-text-caption flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={diffMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      {/* fixed bottom 액션 버튼 */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page">
        <div className="mx-auto max-w-180 px-4 py-4">
          <button
            type="button"
            className="w-full h-12 rounded-xl text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => {
              if (isDailyChallenge) {
                navigate(isCorrect ? "/" : "/daily-challenge", { replace: true });
              } else {
                navigate("/questions");
              }
            }}
          >
            {isDailyChallenge
              ? isCorrect ? "홈으로 가기" : "다시 풀기"
              : "문제 목록으로"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

기대 결과: `built in Xs` — 타입 에러 없음.  
만약 `ChoiceReview` unused import 경고가 있으면 이미 Step 1에서 제거됐으므로 무시.

- [ ] **Step 3: 커밋**

```bash
git add src/pages/AnswerFeedback.tsx
git commit -m "feat: EXECUTABLE 결과 화면 선택지 카드 통합 및 해설 카드 분리 #144"
```

---

## Task 3: ChoiceReview 정리

**Files:**
- Delete (사용자 승인 후): `src/components/ChoiceReview.tsx`

> **주의**: CLAUDE.md 규칙 — "파일 삭제 시 반드시 사용자 허락". Task 2 완료 후 사용자에게 삭제 승인 요청.

- [ ] **Step 1: ChoiceReview 참조 잔존 여부 확인**

```bash
grep -r "ChoiceReview" src/
```

기대 결과: 출력 없음 (Task 2에서 import 이미 제거됨).

- [ ] **Step 2: 사용자에게 파일 삭제 승인 요청**

> "`src/components/ChoiceReview.tsx`는 더 이상 사용되지 않습니다. 삭제할까요?"

- [ ] **Step 3: 승인 시 삭제 및 커밋**

```bash
git rm src/components/ChoiceReview.tsx
git commit -m "chore: 미사용 ChoiceReview 컴포넌트 제거 #144"
```

---

## 자기 검토 (Spec Coverage)

| 스펙 요구사항 | 대응 Task |
|-------------|----------|
| comparisonSection 제거 | Task 2 |
| ChoiceReview 제거 | Task 2 + Task 3 |
| 선택지 카드 통합 목록 | Task 2 |
| 정답 카드 초록 강조 | Task 2 (borderColor/bgColor 로직) |
| 내 선택 카드 파란 강조 | Task 2 (borderColor/bgColor 로직) |
| 정답+내 선택 중복 케이스 | Task 2 ("정답 · 내 선택" 뱃지) |
| selectedResult/correctResult 초기 캐시 | Task 2 (useState 초기값) |
| 나머지 선택지 수동 실행 | Task 2 (실행 버튼) |
| ResultTable 행 구분선 | Task 1 (CSS) |
| ResultTable rounded border | Task 1 (ResultTable.tsx) |
| 해설 카드 분리 | Task 2 (rationaleSection) |
| CONCEPT_ONLY 변경 없음 | Task 2 (conceptSection 기존 로직 유지) |
