# 프론트-백엔드 API 매핑 불일치 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프론트엔드 AI Payload 타입의 snake_case 필드명을 백엔드 camelCase 스펙에 맞추고, 백엔드 미지원 generateChoices/choiceSetId 관련 코드를 제거한다.

**Architecture:** 타입 정의 수정 -> API 함수 수정 -> 훅/페이지 수정 -> mock/테스트 정리 -> 문서 수정 순서. 타입 변경이 컴파일 에러를 일으키므로 이를 가이드 삼아 참조처를 순차 수정.

**Tech Stack:** TypeScript, React 19, Vite

---

### Task 1: AI Payload 타입 수정 (`src/types/api.ts`)

**Files:**
- Modify: `src/types/api.ts:118-128`

- [ ] **Step 1: ExplainErrorPayload 필드명 수정**

```typescript
// Before (line 122)
readonly error_message: string;

// After
readonly errorMessage: string;
```

- [ ] **Step 2: DiffExplainPayload 필드명+타입 수정**

```typescript
// Before (lines 125-128)
export interface DiffExplainPayload {
  readonly question_id: number;
  readonly selected_key: string;
}

// After
export interface DiffExplainPayload {
  readonly questionUuid: string;
  readonly selectedChoiceKey: string;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build 2>&1 | head -30`
Expected: `ExplainErrorPayload`와 `DiffExplainPayload` 사용처에서 타입 에러 발생 (이후 Task에서 수정)

---

### Task 2: SSE 타입 및 SubmitPayload 정리 (`src/types/api.ts`)

**Files:**
- Modify: `src/types/api.ts:154-177`

- [ ] **Step 1: SSE 관련 타입 4개 제거, SubmitPayload에서 choiceSetId 제거**

lines 154-177을 다음으로 교체:

```typescript
// === Submit ===
export interface SubmitPayload {
  readonly selectedChoiceKey: string;
}
```

제거 대상: `ChoiceGenerationPhase`, `ChoiceGenerationStatus`, `ChoiceSetComplete`, `ChoiceGenerationError`, `SubmitPayload.choiceSetId`

---

### Task 3: AnswerFeedback 페이지 수정 (`src/pages/AnswerFeedback.tsx`)

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx:16,35-38`

- [ ] **Step 1: FeedbackState에서 choiceSetId 제거**

```typescript
// Before (line 16)
readonly choiceSetId: string;

// After: 해당 라인 삭제
```

- [ ] **Step 2: diffExplain 호출부 필드명 수정**

```typescript
// Before (lines 35-38)
diffMutation.mutate({
  question_id: 0,
  selected_key: state.selectedKey,
});

// After
diffMutation.mutate({
  questionUuid: state.questionUuid,
  selectedChoiceKey: state.selectedKey,
});
```

---

### Task 4: submitAnswer 함수 수정 (`src/api/questions.ts`)

**Files:**
- Modify: `src/api/questions.ts:1-2,4-15,66-76`

- [ ] **Step 1: generateChoicesMock import 제거 및 SSE 타입 import 제거**

```typescript
// Before (lines 1-15)
import { apiFetch } from "./client";
import { generateChoicesMock } from "./mock-data";
import { getMemberUuid } from "../stores/memberStore";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
} from "../types/api";

// After
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
```

- [ ] **Step 2: submitAnswer에서 choiceSetId 파라미터 제거**

```typescript
// Before (lines 66-76)
export function submitAnswer(
  questionUuid: string,
  choiceSetId: string,
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ choiceSetId, selectedChoiceKey }),
  });
}

// After
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
```

- [ ] **Step 3: generateChoices 함수, ChoiceGenerationCallbacks 인터페이스, USE_MOCK/BASE_URL 상수 삭제**

lines 17-18 (`USE_MOCK`, `BASE_URL`), lines 77-213 (`ChoiceGenerationCallbacks` interface + `generateChoices` function) 전체 삭제.

---

### Task 5: useQuestionDetail 훅 수정 (`src/hooks/useQuestionDetail.ts`)

**Files:**
- Modify: `src/hooks/useQuestionDetail.ts`

- [ ] **Step 1: generateChoices import 및 SSE 타입 import 제거, useSubmitAnswer 수정**

```typescript
// Before (lines 1-9)
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer, generateChoices } from "../api/questions";
import type {
  ChoiceItem,
  ChoiceGenerationPhase,
  ChoiceGenerationError,
  ChoiceSetComplete,
} from "../types/api";

// After
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer } from "../api/questions";
```

- [ ] **Step 2: useSubmitAnswer에서 choiceSetId 제거**

```typescript
// Before (lines 25-29)
export function useSubmitAnswer(questionUuid: string) {
  return useMutation({
    mutationFn: ({ choiceSetId, selectedChoiceKey }: { choiceSetId: string; selectedChoiceKey: string }) =>
      submitAnswer(questionUuid, choiceSetId, selectedChoiceKey),
  });
}

// After
export function useSubmitAnswer(questionUuid: string) {
  return useMutation({
    mutationFn: (selectedChoiceKey: string) =>
      submitAnswer(questionUuid, selectedChoiceKey),
  });
}
```

- [ ] **Step 3: useGenerateChoices 훅 전체 삭제**

lines 32-76 (`GenerateState` type + `useGenerateChoices` function) 전체 삭제.

---

### Task 6: usePrefetch 훅 삭제 (`src/hooks/usePrefetch.ts`)

**Files:**
- Delete: `src/hooks/usePrefetch.ts`

- [ ] **Step 1: usePrefetch.ts 파일 전체 삭제**

이 훅은 `generateChoices`에 전적으로 의존하므로 파일 전체 삭제.

---

### Task 7: QuestionDetail 페이지 수정 (`src/pages/QuestionDetail.tsx`)

**Files:**
- Modify: `src/pages/QuestionDetail.tsx`

이 파일은 `useGenerateChoices`, `usePrefetch`, `ChoicesSkeleton`, `choiceSetId`를 모두 사용 중이므로, 선택지 표시 방식을 백엔드 `QuestionDetail` 응답의 `choices` 필드에서 직접 읽도록 변경.

- [ ] **Step 1: import 정리**

```typescript
// Before (lines 1-18)
import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import { ChoicesSkeleton } from "../components/ChoicesSkeleton";
import AiExplanationSheet from "../components/AiExplanationSheet";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
  useGenerateChoices,
} from "../hooks/useQuestionDetail";
import { usePrefetch } from "../hooks/usePrefetch";
import { fetchRecommendations } from "../api/questions";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";

// After
import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import AiExplanationSheet from "../components/AiExplanationSheet";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
} from "../hooks/useQuestionDetail";
import { fetchRecommendations } from "../api/questions";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";
```

- [ ] **Step 2: 컴포넌트 내부 — usePrefetch, useGenerateChoices 제거, choices를 question에서 직접 사용**

```typescript
// Before (lines 24-28)
const { prefetch, consumeCache } = usePrefetch();
const prefetchedRef = useRef(consumeCache(questionUuid!));
const { state: choicesState, retry: retryGenerate } = useGenerateChoices(questionUuid!, prefetchedRef.current);
const executeMutation = useExecuteChoice(questionUuid!);
const submitMutation = useSubmitAnswer(questionUuid!);

// After
const executeMutation = useExecuteChoice(questionUuid!);
const submitMutation = useSubmitAnswer(questionUuid!);
```

`prefetchTriggeredRef` 선언도 삭제 (line 37).

- [ ] **Step 3: handleSelect에서 prefetch 로직 제거**

```typescript
// Before (lines 56-74) — handleSelect
const handleSelect = useCallback(
  (choiceKey: string, sql: string) => {
    setSelectedKey(choiceKey);
    if (question?.executionMode === "EXECUTABLE" && !executeCacheRef.current[choiceKey]) {
      handleExecute(choiceKey, sql);
    }
    if (!prefetchTriggeredRef.current) {
      prefetchTriggeredRef.current = true;
      fetchRecommendations(1, questionUuid)
        .then((res) => {
          const nextUuid = res.questions[0]?.questionUuid;
          if (nextUuid) prefetch(nextUuid);
        })
        .catch(() => {});
    }
  },
  [handleExecute, prefetch, questionUuid, question],
);

// After
const handleSelect = useCallback(
  (choiceKey: string, sql: string) => {
    setSelectedKey(choiceKey);
    if (question?.executionMode === "EXECUTABLE" && !executeCacheRef.current[choiceKey]) {
      handleExecute(choiceKey, sql);
    }
  },
  [handleExecute, question],
);
```

- [ ] **Step 4: handleSubmit에서 choiceSetId 제거**

```typescript
// Before (lines 76-98) — handleSubmit
const handleSubmit = useCallback(() => {
  if (!selectedKey || !question || choicesState.kind !== "done") return;
  const { choiceSetId, choices } = choicesState;
  submitMutation.mutate(
    { choiceSetId, selectedChoiceKey: selectedKey },
    {
      onSuccess: (result) => {
        const selectedChoice = choices.find((c) => c.key === selectedKey);
        const correctChoice = choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionUuid,
            choiceSetId,
          },
        });
      },
    },
  );
}, [selectedKey, submitMutation, question, choicesState, questionUuid, navigate]);

// After
const choices = question?.choices ?? [];

const handleSubmit = useCallback(() => {
  if (!selectedKey || !question) return;
  submitMutation.mutate(selectedKey, {
    onSuccess: (result) => {
      const selectedChoice = choices.find((c) => c.key === selectedKey);
      const correctChoice = choices.find((c) => c.key === result.correctKey);
      navigate(`/questions/${questionUuid}/result`, {
        state: {
          ...result,
          selectedKey,
          selectedSql: selectedChoice?.body,
          correctSql: correctChoice?.body,
          questionUuid,
        },
      });
    },
  });
}, [selectedKey, submitMutation, question, choices, questionUuid, navigate]);
```

- [ ] **Step 5: handleAskAi에서 choicesState 참조를 choices로 변경**

```typescript
// Before (lines 100-113)
const handleAskAi = useCallback(
  (choiceKey: string, _errorCode: string, errorMessage: string) => {
    setAiSheetOpen(true);
    setAiText("");
    if (choicesState.kind !== "done") return;
    const choice = choicesState.choices.find((c) => c.key === choiceKey);
    explainMutation.mutate({
      questionUuid: questionUuid!,
      sql: choice?.body ?? "",
      error_message: errorMessage,
    });
  },
  [choicesState, questionUuid, explainMutation],
);

// After
const handleAskAi = useCallback(
  (choiceKey: string, _errorCode: string, errorMessage: string) => {
    setAiSheetOpen(true);
    setAiText("");
    const choice = choices.find((c) => c.key === choiceKey);
    explainMutation.mutate({
      questionUuid: questionUuid!,
      sql: choice?.body ?? "",
      errorMessage,
    });
  },
  [choices, questionUuid, explainMutation],
);
```

- [ ] **Step 6: JSX — SSE 상태별 렌더링을 단순 choices 렌더링으로 교체**

```tsx
// Before (lines 179-231) — choicesState.kind별 분기 (loading/error/done)
{choicesState.kind === "loading" && (
  <ChoicesSkeleton phase={choicesState.phase} message={choicesState.message} />
)}
{choicesState.kind === "error" && (...)}
{choicesState.kind === "done" && (
  <section className="mt-4 space-y-3">
    {choicesState.choices.map(...)}
  </section>
)}

// After — choices가 비었으면 스켈레톤, 있으면 렌더링
{choices.length === 0 ? (
  <div className="mt-4 space-y-3">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="card-base space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-border animate-pulse" />
          <div className="w-4 h-4 rounded bg-border animate-pulse" />
        </div>
        <div className="h-16 rounded-lg bg-border animate-pulse" />
      </div>
    ))}
  </div>
) : (
  <section className="mt-4 space-y-3">
    {choices.map((choice) => (
      <ChoiceCard
        key={choice.key}
        choice={choice}
        isSelected={selectedKey === choice.key}
        cached={executeCache[choice.key]}
        isExecutable={question.executionMode === "EXECUTABLE"}
        isExecuting={
          executeMutation.isPending &&
          executeMutation.variables === choice.body
        }
        onSelect={handleSelect}
        onExecute={handleExecute}
        onAskAi={handleAskAi}
      />
    ))}
  </section>
)}
```

- [ ] **Step 7: isSubmitReady 조건 수정**

```typescript
// Before (lines 129-132)
const isSubmitReady =
  selectedKey !== null &&
  choicesState.kind === "done" &&
  !submitMutation.isPending;

// After
const isSubmitReady =
  selectedKey !== null &&
  choices.length > 0 &&
  !submitMutation.isPending;
```

---

### Task 8: ChoicesSkeleton 컴포넌트 삭제 (`src/components/ChoicesSkeleton.tsx`)

**Files:**
- Delete: `src/components/ChoicesSkeleton.tsx`

- [ ] **Step 1: ChoicesSkeleton.tsx 파일 삭제**

SSE 상태를 표시하던 컴포넌트. Task 7에서 인라인 스켈레톤으로 대체했으므로 삭제.

---

### Task 9: mock-data 정리 (`src/api/mock-data.ts`, `src/api/mock-data.test.ts`)

**Files:**
- Modify: `src/api/mock-data.ts:1-23,99-136`
- Modify: `src/api/mock-data.test.ts:210-269`

- [ ] **Step 1: mock-data.ts — SSE 타입 import 제거, generateChoicesMock 함수 삭제**

import에서 `ChoiceGenerationStatus`, `ChoiceSetComplete`, `ChoiceGenerationError` 제거 (lines 19-21).
`ChoiceGenerationCallbacks` interface (lines 99-103)와 `generateChoicesMock` function (lines 106-136) 전체 삭제.

- [ ] **Step 2: mock-data.test.ts — generateChoicesMock 테스트 블록 삭제**

lines 2의 `generateChoicesMock` import 제거.
`describe("generateChoicesMock", ...)` 블록 전체 삭제 (lines 210~끝).

---

### Task 10: api-guide.md 문서 수정

**Files:**
- Modify: `.claude/rules/api-guide.md:56-70`

- [ ] **Step 1: explainError body 스펙 — snake_case를 camelCase로**

```markdown
`explainError`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `questionUuid` | string (UUID) | O | 문제 UUID |
| `sql` | string | O | 사용자가 작성한 SQL |
| `errorMessage` | string | O | 발생한 에러 메시지 |
```

- [ ] **Step 2: diffExplain body 스펙 — snake_case를 camelCase로**

```markdown
`diffExplain`:
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `questionUuid` | string (UUID) | O | 문제 UUID |
| `selectedChoiceKey` | string | O | 사용자가 선택한 답 키 |
```

---

### Task 11: 빌드 검증 및 커밋

- [ ] **Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 성공

- [ ] **Step 2: 커밋**

```bash
git add src/types/api.ts src/api/ai.ts src/api/questions.ts src/api/mock-data.ts src/api/mock-data.test.ts src/hooks/useQuestionDetail.ts src/pages/QuestionDetail.tsx src/pages/AnswerFeedback.tsx .claude/rules/api-guide.md docs/issues/20260409_frontend-backend-api-mismatch.md
git add -u src/hooks/usePrefetch.ts src/components/ChoicesSkeleton.tsx
git commit -m "fix: AI Payload snake_case→camelCase 수정, generateChoices/choiceSetId 제거 #41"
```
