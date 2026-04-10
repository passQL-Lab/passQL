# Practice 모드 듀오링고식 피드백 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Practice 모드에서 문제를 제출하면 바로 정답/오답 피드백을 보여주고, 오답이면 해설을 인라인으로 표시한 후 다음 문제로 넘어가게 한다.

**Architecture:** PracticeSet에 피드백 상태를 추가하고, 제출 후 하단에 듀오링고 스타일 피드백 바를 표시. 별도 페이지 이동 없이 같은 화면에서 처리.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### 현재 흐름
```
선택지 클릭 -> 제출 버튼 -> submitAnswer() -> 바로 다음 문제
```

### 변경 후 흐름
```
선택지 클릭 -> 제출 버튼 -> submitAnswer() -> 피드백 표시 (스크롤 잠금)
  정답: 초록 하단 바 "정답이에요!" + rationale + [다음 문제] 버튼
  오답: 빨강 하단 바 "오답이에요" + rationale + [다음 문제] 버튼
[다음 문제] 클릭 -> 피드백 닫고 다음 문제로 이동
```

---

### Task 1: PracticeFeedbackBar 컴포넌트 생성

**Files:**
- Create: `src/components/PracticeFeedbackBar.tsx`

- [ ] **Step 1: 컴포넌트 작성**

듀오링고 스타일 하단 고정 피드백 바. 정답이면 초록, 오답이면 빨강.

```tsx
// src/components/PracticeFeedbackBar.tsx
import { Check, X } from "lucide-react";
import type { SubmitResult } from "../types/api";

interface PracticeFeedbackBarProps {
  readonly result: SubmitResult;
  readonly onNext: () => void;
  readonly nextLabel: string;
}

export default function PracticeFeedbackBar({
  result,
  onNext,
  nextLabel,
}: PracticeFeedbackBarProps) {
  const isCorrect = result.isCorrect;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 animate-slide-up"
      style={{
        backgroundColor: isCorrect
          ? "var(--color-sem-success-light)"
          : "var(--color-sem-error-light)",
      }}
    >
      <div className="mx-auto max-w-120 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          {isCorrect ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7" }}
            >
              <Check size={18} style={{ color: "var(--color-sem-success-text)" }} />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <X size={18} style={{ color: "var(--color-sem-error-text)" }} />
            </div>
          )}
          <div>
            <p
              className="text-base font-bold"
              style={{
                color: isCorrect
                  ? "var(--color-sem-success-text)"
                  : "var(--color-sem-error-text)",
              }}
            >
              {isCorrect ? "정답이에요!" : "오답이에요"}
            </p>
            {!isCorrect && (
              <p className="text-xs text-text-secondary mt-0.5">
                정답: {result.correctKey}
              </p>
            )}
          </div>
        </div>

        {result.rationale && (
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {result.rationale}
          </p>
        )}

        <button
          type="button"
          className="w-full h-12 rounded-lg text-white font-bold text-base"
          style={{
            backgroundColor: isCorrect
              ? "var(--color-sem-success)"
              : "var(--color-sem-error)",
          }}
          onClick={onNext}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: slide-up 애니메이션 추가**

`src/index.css`(또는 tailwind config)에 추가:

```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.25s ease-out;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 4: 커밋**

```bash
git add src/components/PracticeFeedbackBar.tsx src/index.css
git commit -m "feat: PracticeFeedbackBar 듀오링고식 피드백 컴포넌트 #41"
```

---

### Task 2: PracticeSet에 피드백 상태 추가

**Files:**
- Modify: `src/pages/PracticeSet.tsx`

- [ ] **Step 1: import 추가 + 상태 추가**

```tsx
import { useState, useCallback } from "react";
// ... 기존 import
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import type { SubmitResult } from "../types/api";
```

컴포넌트 안에 상태 추가:
```tsx
const [feedback, setFeedback] = useState<SubmitResult | null>(null);
```

- [ ] **Step 2: handleSelect를 제출+피드백 표시로 변경**

```tsx
  const handleSelect = useCallback(
    async (selectedChoiceKey: string) => {
      if (!question) return;
      try {
        const result = await submitAnswer(question.questionUuid, selectedChoiceKey);
        setFeedback(result);
        submitAndAdvance(question.questionUuid, result.isCorrect, selectedChoiceKey);
      } catch {
        const fallback: SubmitResult = { isCorrect: false, correctKey: "?", rationale: "" };
        setFeedback(fallback);
        submitAndAdvance(question.questionUuid, false, selectedChoiceKey);
      }
    },
    [question, submitAndAdvance],
  );
```

주의: `submitAndAdvance`는 `currentIndex`를 올리지만, `feedback`이 있는 동안 다음 문제를 렌더링하지 않음 (아래 Step 3).

- [ ] **Step 3: handleNext로 피드백 닫고 다음 문제 표시**

```tsx
  const handleNext = useCallback(() => {
    setFeedback(null);
  }, []);
```

- [ ] **Step 4: 렌더링 로직 변경**

`currentIndex >= totalQuestions` 체크를 feedback 닫힌 후로 이동:

```tsx
  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  // 피드백 없고 + 모든 문제 완료 -> 결과 화면
  if (!feedback && currentIndex >= totalQuestions) {
    navigate(`/practice/${sessionId}/result`, { replace: true });
    return null;
  }

  // 피드백 표시 중이면 이전 문제(currentIndex - 1)를 보여줌
  const displayIndex = feedback ? currentIndex - 1 : currentIndex;
  const displayQuestion = questions[displayIndex];
```

프로그레스 바와 카운터도 `displayIndex` 사용:
```tsx
  <span className="text-sm font-semibold text-text-secondary text-center">
    {displayIndex + 1} / {totalQuestions}
  </span>
  // ...
  style={{ width: `${((displayIndex + 1) / totalQuestions) * 100}%` }}
```

- [ ] **Step 5: 피드백 바 + 스크롤 잠금 렌더링**

QuestionDetail 아래에 추가:

```tsx
      {displayQuestion ? (
        <div className={`flex-1 overflow-y-auto px-4 ${feedback ? "pointer-events-none opacity-60" : ""}`}>
          <QuestionDetail
            key={displayQuestion.questionUuid}
            questionUuid={displayQuestion.questionUuid}
            practiceMode
            practiceSubmitLabel={isLast ? "결과 보기" : "다음 문제"}
            onPracticeSubmit={handleSelect}
          />
        </div>
      ) : (
        <WaitingForQuestion topicName={topicName ?? ""} />
      )}

      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          onNext={handleNext}
          nextLabel={currentIndex >= totalQuestions ? "결과 보기" : "다음 문제"}
        />
      )}
```

피드백이 뜨면 문제 영역은 `pointer-events-none + opacity-60`으로 비활성화.

- [ ] **Step 6: isLast 계산 수정**

```tsx
  const isLast = displayIndex >= totalQuestions - 1;
```

- [ ] **Step 7: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 8: 커밋**

```bash
git add src/pages/PracticeSet.tsx
git commit -m "feat: Practice 문제별 듀오링고식 정답/오답 피드백 표시 #41"
```
