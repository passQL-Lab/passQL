# 문제 풀이 이탈 방지 경고 모달 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문제 풀이 도중 다른 화면으로 이동 시도 시 경고 모달을 띄워 풀이 기록 유실을 방지한다.

**Architecture:** React Router DOM v7의 `useBlocker` 훅으로 앱 내 네비게이션을 가로채고, 공통 `ConfirmModal` 컴포넌트로 이탈 여부를 확인한다. `ConfirmModal`을 먼저 만들고, 이후 3개 페이지에 순서대로 연결한다.

**Tech Stack:** React 19, React Router DOM v7 (`useBlocker`), TypeScript, Tailwind CSS 4, daisyUI 5

---

## 파일 구조

| 파일 | 변경 유형 | 책임 |
|---|---|---|
| `client/src/components/ConfirmModal.tsx` | 신규 생성 | 범용 Confirm 다이얼로그 UI |
| `client/src/pages/PracticeSet.tsx` | 수정 | `useBlocker` + `ConfirmModal` 연결 |
| `client/src/pages/DailyChallenge.tsx` | 수정 | `useBlocker` + `ConfirmModal` 연결 |
| `client/src/pages/QuestionDetail.tsx` | 수정 | `submitted` state 추가, `useBlocker` + `ConfirmModal` 연결 |

---

### Task 1: ConfirmModal 컴포넌트 구현

**Files:**
- Create: `client/src/components/ConfirmModal.tsx`

- [ ] **Step 1: `ConfirmModal.tsx` 파일 생성**

`client/src/components/ConfirmModal.tsx`를 아래 내용으로 생성한다.

```tsx
import { useEffect } from "react";

interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  // 파괴적 액션 레이블 (예: "나가기") — Secondary 버튼
  readonly confirmLabel: string;
  // 유지 액션 레이블 (예: "계속 풀기") — Primary 버튼
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // ESC 키로 모달 닫기 (이탈 취소)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    // 오버레이 — 클릭 시 이탈 취소
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}
      onClick={onCancel}
    >
      {/* 모달 카드 — 클릭 이벤트 버블링 방지 */}
      <div
        className="w-full md:max-w-sm bg-white border border-border rounded-t-2xl md:rounded-2xl px-5 pt-6 pb-8 md:pb-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 drag handle 역할의 시각적 인디케이터 */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        <div className="flex flex-col gap-2">
          {/* 유지 액션: Primary 버튼 (파괴적 액션 비강조) */}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          {/* 파괴적 액션: Secondary 버튼 */}
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
git add src/components/ConfirmModal.tsx
git commit -m "feat: 범용 ConfirmModal 컴포넌트 추가 #028"
```

---

### Task 2: PracticeSet에 이탈 방지 적용

**Files:**
- Modify: `client/src/pages/PracticeSet.tsx`

현재 `PracticeSet.tsx`의 import와 Home 버튼 `onClick`을 수정하고, `useBlocker` + `ConfirmModal`을 연결한다.

- [ ] **Step 1: import 수정**

`client/src/pages/PracticeSet.tsx` 파일 상단의 import를 아래와 같이 수정한다.

```tsx
import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Navigate, useBlocker } from "react-router-dom";
import { Home } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitAnswer } from "../api/questions";
import { getRandomMessage } from "../constants/microcopy";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import type { SubmitResult } from "../types/api";
```

- [ ] **Step 2: `useBlocker` 추가 및 Home 버튼 `onClick` 제거**

`PracticeSet` 함수 내부에서 `const [feedback, setFeedback] = useState<SubmitResult | null>(null);` 바로 아래에 `useBlocker`를 추가한다.

```tsx
const [feedback, setFeedback] = useState<SubmitResult | null>(null);

// 마지막 문제 완료 전까지 이탈 차단 — 중간 이탈 시 세션 기록 유실 방지
const blocker = useBlocker(!shouldNavigateToResult);
```

단, `shouldNavigateToResult`는 아래 기존 코드보다 먼저 선언되어야 한다. 기존 코드에서 `shouldNavigateToResult` 선언 위치를 확인하고, `useBlocker`는 그 아래에 위치시킨다. 현재 `PracticeSet.tsx`에서 `shouldNavigateToResult`는 `useEffect` 바로 위에 선언되어 있으므로, 아래 순서로 배치한다.

```tsx
const [feedback, setFeedback] = useState<SubmitResult | null>(null);

const totalQuestions = questions.length;
const displayIndex = feedback ? currentIndex - 1 : currentIndex;
const displayQuestion = questions[displayIndex];
const isLast = displayIndex >= totalQuestions - 1;

// ... (handleSelect, handleNext는 그대로 유지)

if (!storeSessionId || storeSessionId !== sessionId) {
  return <Navigate to="/questions" replace />;
}

const shouldNavigateToResult = !feedback && currentIndex >= totalQuestions;

// 마지막 문제 완료 전까지 이탈 차단 — 중간 이탈 시 세션 기록 유실 방지
const blocker = useBlocker(!shouldNavigateToResult);

useEffect(() => {
  if (shouldNavigateToResult) {
    navigate(`/practice/${sessionId}/result`, { replace: true });
  }
}, [shouldNavigateToResult, navigate, sessionId]);
```

**주의**: `useBlocker`는 훅이므로 조건부 렌더링(`return <Navigate .../>`) 이전에 호출해야 한다. 현재 `PracticeSet.tsx`에서 `if (!storeSessionId || storeSessionId !== sessionId)` 체크가 훅 호출보다 먼저 있으면 훅 순서 위반이 된다. 따라서 `useBlocker`를 해당 조건문 이전으로 올린다.

실제 수정 내용 — `PracticeSet` 함수 내부를 아래 순서로 재배치한다:

```tsx
export default function PracticeSet() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const storeSessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const topicName = usePracticeStore((s) => s.topicName);
  const submitAndAdvance = usePracticeStore((s) => s.submitAndAdvance);

  const [feedback, setFeedback] = useState<SubmitResult | null>(null);

  const totalQuestions = questions.length;
  const displayIndex = feedback ? currentIndex - 1 : currentIndex;
  const displayQuestion = questions[displayIndex];
  const isLast = displayIndex >= totalQuestions - 1;

  // 마지막 문제 완료 여부 — useBlocker 조건 및 결과 페이지 이동에 모두 사용
  const shouldNavigateToResult = !feedback && currentIndex >= totalQuestions;

  // 마지막 문제 완료 전까지 이탈 차단 — 중간 이탈 시 세션 기록 유실 방지
  const blocker = useBlocker(!shouldNavigateToResult);

  const handleSelect = useCallback(
    async (selectedChoiceKey: string, choiceSetId: string) => {
      if (!displayQuestion) return;
      try {
        const result = await submitAnswer(displayQuestion.questionUuid, choiceSetId, selectedChoiceKey);
        setFeedback(result);
        submitAndAdvance(displayQuestion.questionUuid, result.isCorrect, selectedChoiceKey);
      } catch {
        const fallback: SubmitResult = {
          isCorrect: false,
          correctKey: "?",
          rationale: "",
          selectedResult: null,
          correctResult: null,
          selectedSql: null,
          correctSql: null,
        };
        setFeedback(fallback);
        submitAndAdvance(displayQuestion.questionUuid, false, selectedChoiceKey);
      }
    },
    [displayQuestion, submitAndAdvance],
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
  }, []);

  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  useEffect(() => {
    if (shouldNavigateToResult) {
      navigate(`/practice/${sessionId}/result`, { replace: true });
    }
  }, [shouldNavigateToResult, navigate, sessionId]);

  if (shouldNavigateToResult) {
    return null;
  }

  // ... JSX
}
```

- [ ] **Step 3: JSX에 ConfirmModal 추가**

`PracticeSet` JSX의 최상위 `<div>` 내부 마지막에 `ConfirmModal`을 추가하고, Home 버튼의 `onClick`에서 `navigate("/")` 직접 호출을 제거한다 (blocker가 이미 가로채므로 불필요).

```tsx
return (
  <div className="flex flex-col h-screen max-w-120 mx-auto w-full">
    <div className="px-4 pt-3 pb-2">
      <div className="grid grid-cols-3 items-center mb-2">
        <div className="justify-self-start">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-colors"
            onClick={() => navigate("/")}
          >
            <Home size={18} className="text-text-secondary" />
          </button>
        </div>
        <span className="text-sm font-semibold text-text-secondary text-center">
          {displayIndex + 1} / {totalQuestions}
        </span>
        <div className="justify-self-end">
          <span className="badge-topic">{topicName}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-300"
          style={{ width: `${((displayIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </div>

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

    {/* 이탈 방지 확인 모달 */}
    <ConfirmModal
      isOpen={blocker.state === "blocked"}
      title="풀이를 그만할까요?"
      description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
      cancelLabel="계속 풀기"
      confirmLabel="나가기"
      onCancel={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
    />
  </div>
);
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
git add src/pages/PracticeSet.tsx
git commit -m "feat: PracticeSet 이탈 방지 경고 모달 적용 #028"
```

---

### Task 3: DailyChallenge에 이탈 방지 적용

**Files:**
- Modify: `client/src/pages/DailyChallenge.tsx`

- [ ] **Step 1: import 수정**

`client/src/pages/DailyChallenge.tsx` 상단 import에 `useBlocker`와 `ConfirmModal`을 추가한다.

```tsx
import { useState, useCallback } from "react";
import { useNavigate, Navigate, useBlocker } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useTodayQuestion } from "../hooks/useHome";
import { useMemberStore } from "../stores/memberStore";
import { submitAnswer } from "../api/questions";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import type { ChoiceItem, SubmitResult } from "../types/api";
```

- [ ] **Step 2: `useBlocker` 추가**

`DailyChallenge` 함수 내부에서 `const [feedback, setFeedback] = useState<SubmitResult | null>(null);` 바로 아래에 추가한다.

```tsx
const [feedback, setFeedback] = useState<SubmitResult | null>(null);

// 제출 완료 전까지 이탈 차단 — 정답 제출 전 이탈 시 오늘 기록 미저장
const blocker = useBlocker(feedback === null);
```

- [ ] **Step 3: JSX에 ConfirmModal 추가**

`DailyChallenge` JSX 최상위 반환 요소의 마지막에 `ConfirmModal`을 추가한다. 기존 JSX 구조를 유지하면서 닫는 태그 직전에 삽입한다.

```tsx
{/* 이탈 방지 확인 모달 */}
<ConfirmModal
  isOpen={blocker.state === "blocked"}
  title="풀이를 그만할까요?"
  description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
  cancelLabel="계속 풀기"
  confirmLabel="나가기"
  onCancel={() => blocker.reset?.()}
  onConfirm={() => blocker.proceed?.()}
/>
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
git add src/pages/DailyChallenge.tsx
git commit -m "feat: DailyChallenge 이탈 방지 경고 모달 적용 #028"
```

---

### Task 4: QuestionDetail에 이탈 방지 적용

**Files:**
- Modify: `client/src/pages/QuestionDetail.tsx`

단독 풀이 모드(`practiceMode === false`)일 때만 이탈 차단을 활성화한다. `submitted` state를 추가해 제출 완료 후 차단을 해제한다.

- [ ] **Step 1: import 수정**

`client/src/pages/QuestionDetail.tsx` 상단 import에 `useBlocker`와 `ConfirmModal`을 추가한다.

```tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown, BookOpen, RefreshCw } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { SchemaViewer } from "../components/SchemaViewer";
import { SqlPlayground } from "../components/SqlPlayground";
import { executeChoice, generateChoices } from "../api/questions";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
} from "../hooks/useQuestionDetail";
import { explainError } from "../api/ai";
import ConfirmModal from "../components/ConfirmModal";
import type { ChoiceItem, ExecuteResult, SubmitResult } from "../types/api";
```

- [ ] **Step 2: `submitted` state 및 `useBlocker` 추가**

`QuestionDetail` 함수 내부 기존 state 선언 블록 아래에 추가한다. `const [selectedKey, setSelectedKey] = useState<string | null>(null);` 바로 아래에 삽입한다.

```tsx
const [selectedKey, setSelectedKey] = useState<string | null>(null);
// 제출 완료 여부 — true가 되면 이탈 차단 해제
const [submitted, setSubmitted] = useState(false);
```

그리고 state 선언 블록 끝 (SSE 관련 state 아래)에 `useBlocker`를 추가한다.

```tsx
// 단독 풀이 모드에서 제출 완료 전까지 이탈 차단 — practiceMode는 부모가 이미 차단하므로 제외
const blocker = useBlocker(!practiceMode && !submitted);
```

- [ ] **Step 3: `handleSubmit`에서 제출 성공 시 `submitted` 설정**

기존 `handleSubmit` 콜백의 `onSuccess` 내부에서 navigate/onSubmitSuccess 호출 직전에 `setSubmitted(true)`를 추가한다.

```tsx
const handleSubmit = useCallback(() => {
  if (!selectedKey || !question || !choiceSetId) return;
  if (practiceMode && onPracticeSubmit) {
    onPracticeSubmit(selectedKey, choiceSetId, choices);
    return;
  }
  submitMutation.mutate({ choiceSetId, selectedChoiceKey: selectedKey }, {
    onSuccess: (result) => {
      // 제출 완료 — 이탈 차단 해제 후 네비게이션
      setSubmitted(true);
      const fullResult = {
        ...result,
        selectedKey,
        questionUuid,
        executionMode: question.executionMode,
      };
      if (onSubmitSuccess) {
        onSubmitSuccess(fullResult as SubmitResult, questionUuid!);
      } else {
        navigate(`/questions/${questionUuid}/result`, { state: fullResult });
      }
    },
  });
}, [selectedKey, choiceSetId, submitMutation, question, questionUuid, navigate, practiceMode, onPracticeSubmit, onSubmitSuccess, choices]);
```

- [ ] **Step 4: JSX에 ConfirmModal 추가**

`QuestionDetail`의 return 문 최상위 `<div className="flex flex-col h-full">` 내부 맨 마지막(`</div>` 닫기 직전)에 `AiExplanationSheet` 다음으로 추가한다.

```tsx
<AiExplanationSheet
  isOpen={aiSheetOpen}
  isLoading={explainMutation.isPending}
  text={aiText}
  onClose={() => setAiSheetOpen(false)}
/>

{/* 단독 풀이 모드에서만 이탈 방지 모달 표시 */}
{!practiceMode && (
  <ConfirmModal
    isOpen={blocker.state === "blocked"}
    title="풀이를 그만할까요?"
    description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
    cancelLabel="계속 풀기"
    confirmLabel="나가기"
    onCancel={() => blocker.reset?.()}
    onConfirm={() => blocker.proceed?.()}
  />
)}
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
git add src/pages/QuestionDetail.tsx
git commit -m "feat: QuestionDetail 단독 풀이 모드 이탈 방지 경고 모달 적용 #028"
```
