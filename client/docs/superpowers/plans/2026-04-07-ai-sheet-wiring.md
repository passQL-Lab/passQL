# AI Sheet 연결 + useMember 동기화 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AiExplanationSheet를 QuestionDetail/AnswerFeedback에 연결하여 실 API를 호출하고, Home/Settings에 useMember 훅을 추가하여 닉네임을 서버와 동기화한다.

**Architecture:** AiExplanationSheet를 mock 타이머 → 실제 useMutation으로 리팩토링한다. props에 `text`를 외부에서 주입하는 방식으로 변경. QuestionDetail에서 explainError 호출, AnswerFeedback에서 diffExplain 호출 시 Sheet를 열고 결과를 표시한다.

**Tech Stack:** React 19, TanStack Query useMutation, 기존 AI API 함수

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/components/AiExplanationSheet.tsx` | mock 제거, text props 수신, 외부에서 로딩/텍스트 전달 |
| Modify | `src/components/ChoiceCard.tsx` | "AI에게 물어보기" onClick props 추가 |
| Modify | `src/pages/QuestionDetail.tsx` | explainError mutation + AiSheet 상태 관리 |
| Modify | `src/pages/AnswerFeedback.tsx` | diffExplain mutation + AiSheet 상태 관리 |
| Modify | `src/pages/Home.tsx` | useMember() 호출 추가 |

---

### Task 1: AiExplanationSheet 리팩토링 — mock 제거, props 기반

**Files:**
- Modify: `src/components/AiExplanationSheet.tsx`

- [ ] **Step 1: AiExplanationSheet props 변경**

mock 타이머와 MOCK_EXPLANATION 제거. 외부에서 `isLoading`, `text`를 props로 받는 구조로 변경.

```tsx
import { useMemo } from "react";
import { X } from "lucide-react";

interface AiExplanationSheetProps {
  readonly isOpen: boolean;
  readonly isLoading: boolean;
  readonly text: string;
  readonly onClose: () => void;
}

function renderMarkdown(text: string) {
  const parts: Array<{ readonly type: string; readonly content: string }> = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      parts.push({ type: "code", content: codeLines.join("\n") });
      i++;
      continue;
    }

    parts.push({ type: "text", content: line });
    i++;
  }

  return parts.map((part, idx) => {
    if (part.type === "code") {
      return (
        <pre key={idx} className="code-block my-3">
          <code>{part.content}</code>
        </pre>
      );
    }

    if (part.content === "") {
      return <div key={idx} className="h-4" />;
    }

    const rendered = part.content.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((segment, j) => {
      if (segment.startsWith("**") && segment.endsWith("**")) {
        return (
          <strong key={j} className="font-bold text-text-primary">
            {segment.slice(2, -2)}
          </strong>
        );
      }
      if (segment.startsWith("`") && segment.endsWith("`")) {
        return (
          <code
            key={j}
            className="font-mono text-[13px] px-1 py-0.5 rounded"
            style={{ backgroundColor: "var(--color-surface-code)" }}
          >
            {segment.slice(1, -1)}
          </code>
        );
      }
      return segment;
    });

    return (
      <p key={idx} className="text-[15px] leading-relaxed" style={{ color: "#374151" }}>
        {rendered}
      </p>
    );
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="h-4 rounded bg-border animate-pulse w-full" />
      <div className="h-4 rounded bg-border animate-pulse w-[85%]" />
      <div className="h-4 rounded bg-border animate-pulse w-[60%]" />
      <p className="text-caption text-center mt-6">AI가 분석 중입니다...</p>
    </div>
  );
}

export default function AiExplanationSheet({ isOpen, isLoading, text, onClose }: AiExplanationSheetProps) {
  const renderedContent = useMemo(
    () => (isLoading || !text ? null : renderMarkdown(text)),
    [isLoading, text],
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[80vh] z-50">
        <div className="bg-surface-card rounded-t-2xl md:rounded-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
          <div className="md:hidden flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-border-muted" />
          </div>
          <div className="sticky top-0 bg-surface-card flex items-center justify-between px-4 py-3 border-b border-border z-10">
            <h2 className="text-lg font-bold text-text-primary">AI 해설</h2>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4">
            {isLoading ? <LoadingSkeleton /> : renderedContent}
          </div>
          {!isLoading && text && (
            <div className="px-5 pb-4 text-right">
              <span className="text-caption text-xs">프롬프트 v1 · qwen2.5:7b</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/AiExplanationSheet.tsx
git commit -m "refactor: AiExplanationSheet mock 제거, props 기반으로 리팩토링 #13"
```

---

### Task 2: QuestionDetail에 explainError + AiSheet 연결

**Files:**
- Modify: `src/components/ChoiceCard.tsx`
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: ChoiceCard에 onAskAi props 추가**

ChoiceCard interface에 추가:
```typescript
readonly onAskAi?: (choiceKey: string, errorCode: string, errorMessage: string) => void;
```

"AI에게 물어보기" 버튼의 onClick:
```tsx
<button
  className="text-brand text-sm font-medium"
  type="button"
  onClick={() => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")}
>
  AI에게 물어보기
</button>
```

- [ ] **Step 2: QuestionDetail에 explainError mutation + AiSheet 상태 추가**

import 추가:
```typescript
import { useMutation } from "@tanstack/react-query";
import { explainError } from "../api/ai";
import AiExplanationSheet from "../components/AiExplanationSheet";
```

상태 추가:
```typescript
const [aiSheetOpen, setAiSheetOpen] = useState(false);
const [aiText, setAiText] = useState("");
const explainMutation = useMutation({
  mutationFn: explainError,
  onSuccess: (result) => setAiText(result.text),
});
```

handleAskAi 콜백:
```typescript
const handleAskAi = useCallback((_choiceKey: string, _errorCode: string, errorMessage: string) => {
  setAiSheetOpen(true);
  setAiText("");
  const choice = question?.choices.find((c) => c.key === _choiceKey);
  explainMutation.mutate({
    questionId,
    sql: choice?.body ?? "",
    errorMessage,
  });
}, [question, questionId, explainMutation]);
```

ChoiceCard에 prop 추가:
```tsx
<ChoiceCard
  ...
  onAskAi={handleAskAi}
/>
```

JSX 끝에 AiSheet 추가 (submit 버튼 위):
```tsx
<AiExplanationSheet
  isOpen={aiSheetOpen}
  isLoading={explainMutation.isPending}
  text={aiText}
  onClose={() => setAiSheetOpen(false)}
/>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/ChoiceCard.tsx src/pages/QuestionDetail.tsx
git commit -m "feat: QuestionDetail에 explainError + AiExplanationSheet 연결 #13"
```

---

### Task 3: AnswerFeedback에 diffExplain + AiSheet 연결

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: AnswerFeedback에 diffExplain mutation + AiSheet 추가**

import 추가:
```typescript
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import AiExplanationSheet from "../components/AiExplanationSheet";
```

상태 + mutation:
```typescript
const [aiSheetOpen, setAiSheetOpen] = useState(false);
const [aiText, setAiText] = useState("");
const diffMutation = useMutation({
  mutationFn: diffExplain,
  onSuccess: (result) => setAiText(result.text),
});

const handleAskAi = () => {
  setAiSheetOpen(true);
  setAiText("");
  diffMutation.mutate({
    questionId: state.questionId,
    selectedKey: state.selectedKey,
  });
};
```

오답 버전의 "AI에게 자세히 물어보기" 버튼 — 현재 card-base 안의 마지막 부분. rationale 아래에 버튼 추가:
```tsx
<button className="btn-primary w-full mt-4" type="button" onClick={handleAskAi}>
  AI에게 자세히 물어보기
</button>
```

JSX 끝 (bottom bar 위)에 AiSheet:
```tsx
<AiExplanationSheet
  isOpen={aiSheetOpen}
  isLoading={diffMutation.isPending}
  text={aiText}
  onClose={() => setAiSheetOpen(false)}
/>
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AnswerFeedback.tsx
git commit -m "feat: AnswerFeedback에 diffExplain + AiExplanationSheet 연결 #13"
```

---

### Task 4: Home에 useMember 호출 추가

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: useMember import + 호출**

Home.tsx 상단에 추가:
```typescript
import { useMember } from "../hooks/useMember";
```

컴포넌트 안에 추가 (useProgress 아래):
```typescript
useMember(); // fetchMe로 최신 닉네임 동기화
```

이것만으로 충분 — useMember 내부에서 fetchMe 결과를 memberStore에 동기화하므로, nickname이 자동으로 업데이트됨.

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: Home에 useMember 호출 추가 (닉네임 서버 동기화) #13"
```
