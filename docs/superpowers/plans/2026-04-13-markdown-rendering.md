# Markdown Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 피드백·해설·문제 지문 3곳에 Markdown 렌더링을 지원하고, AI 리포트의 단어별 fade-in 애니메이션을 React 방식으로 재구현한다.

**Architecture:** `MarkdownText` 공용 컴포넌트가 `ReactMarkdown`의 `components` prop으로 각 요소를 커스텀 처리한다. `animated=true`이면 React Context(`WordIndexContext`)로 전역 단어 인덱스를 관리하고, CSS `--i` custom property로 `animation-delay`를 계산해 순차 fade-in한다. DOM 직접 조작 없이 순수 React 방식.

**Tech Stack:** react-markdown@10 (이미 설치), React Context, CSS custom properties, Tailwind CSS 4

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `src/components/MarkdownText.tsx` | 신규 생성 — 공용 Markdown 렌더링 컴포넌트 |
| `src/styles/components.css` | 기존 `.ai-word` 유지 + `.md-word` 추가 |
| `src/pages/PracticeResult.tsx` | `useAiText` → `MarkdownText animated` 교체 |
| `src/components/PracticeFeedbackBar.tsx` | rationale plain text → `MarkdownText` 교체 |
| `src/pages/QuestionDetail.tsx` | 인라인 `ReactMarkdown` → `MarkdownText` 교체 |
| `src/hooks/useAiText.ts` | 삭제 |

---

## Task 1: CSS 애니메이션 추가

**Files:**
- Modify: `client/src/styles/components.css`

- [ ] **Step 1: `.md-word` 클래스 추가**

`components.css`의 `.ai-word-visible` 블록 바로 아래에 추가:

```css
/* ── MarkdownText 단어 fade-in (CSS custom property 방식) ── */
/* animated=true 시 각 단어 <span>에 style="--i: N" 주입 → delay 자동 계산 */
.md-word {
  display: inline;
  opacity: 0;
  filter: blur(4px);
  transform: translateY(2px);
  animation: ai-word-in 0.25s ease-out both;
  animation-delay: calc(var(--i, 0) * 55ms + 200ms);
}
```

기존 `ai-word-in` 키프레임을 재사용하므로 새 `@keyframes` 불필요.

- [ ] **Step 2: 확인**

`components.css`에 `.md-word` 클래스가 추가되었는지 확인.

---

## Task 2: MarkdownText 컴포넌트 생성

**Files:**
- Create: `client/src/components/MarkdownText.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
import { createContext, useContext, useRef } from "react";
import ReactMarkdown from "react-markdown";

// 전역 단어 인덱스 카운터 — Context로 커스텀 컴포넌트 간 공유
// animated=true 시 MarkdownText가 Provider로 감싸고, 각 요소가 ref를 소비
const WordIndexContext = createContext<{ current: number } | null>(null);

/** 단어를 공백 기준으로 쪼개 <span style="--i: N">단어</span> 배열로 변환 */
function splitToAnimatedSpans(
  text: string,
  indexRef: { current: number },
): React.ReactNode[] {
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    if (/^\s+$/.test(token)) return token;
    const idx = indexRef.current++;
    return (
      <span key={i} className="md-word" style={{ "--i": idx } as React.CSSProperties}>
        {token}
      </span>
    );
  });
}

/** children 안의 텍스트 노드를 재귀적으로 추출해 animated span으로 교체 */
function animateChildren(
  children: React.ReactNode,
  indexRef: { current: number },
): React.ReactNode {
  return Array.isArray(children)
    ? children.map((child) => animateChildren(child, indexRef))
    : typeof children === "string"
      ? splitToAnimatedSpans(children, indexRef)
      : children;
}

/** animated=true 시 children 텍스트를 단어 단위 fade-in span으로 변환하는 훅 */
function useAnimatedChildren(children: React.ReactNode, animated: boolean) {
  const indexRef = useContext(WordIndexContext);
  if (!animated || !indexRef) return children;
  return animateChildren(children, indexRef);
}

// ── 커스텀 Markdown 요소 컴포넌트 ──────────────────────────────

function MdP({ children }: { children?: React.ReactNode }) {
  const animated = useContext(WordIndexContext) !== null;
  const content = useAnimatedChildren(children, animated);
  return <p className="text-body leading-relaxed mb-2 last:mb-0">{content}</p>;
}

function MdStrong({ children }: { children?: React.ReactNode }) {
  const animated = useContext(WordIndexContext) !== null;
  const content = useAnimatedChildren(children, animated);
  return <strong className="font-bold">{content}</strong>;
}

function MdEm({ children }: { children?: React.ReactNode }) {
  const animated = useContext(WordIndexContext) !== null;
  const content = useAnimatedChildren(children, animated);
  return <em className="italic">{content}</em>;
}

function MdInlineCode({ children }: { children?: React.ReactNode }) {
  // 인라인 코드는 단어 분해 없이 통째로 — 코드는 쪼개면 의미 손실
  return (
    <code className="bg-surface-code px-1 rounded text-xs font-mono">
      {children}
    </code>
  );
}

function MdPre({ children }: { children?: React.ReactNode }) {
  return (
    <pre className="bg-surface-code rounded-lg px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word font-mono my-2">
      {children}
    </pre>
  );
}

function MdUl({ children }: { children?: React.ReactNode }) {
  return <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>;
}

function MdOl({ children }: { children?: React.ReactNode }) {
  return <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>;
}

function MdLi({ children }: { children?: React.ReactNode }) {
  const animated = useContext(WordIndexContext) !== null;
  const content = useAnimatedChildren(children, animated);
  return <li className="text-body leading-relaxed">{content}</li>;
}

// ── 컴포넌트 맵 ───────────────────────────────────────────────

const MD_COMPONENTS = {
  p: MdP,
  strong: MdStrong,
  em: MdEm,
  code: MdInlineCode,
  pre: MdPre,
  ul: MdUl,
  ol: MdOl,
  li: MdLi,
} as const;

// ── MarkdownText 메인 컴포넌트 ────────────────────────────────

interface MarkdownTextProps {
  readonly text: string;
  /** 단어별 fade-in 애니메이션 여부 — AI 리포트에만 true */
  readonly animated?: boolean;
  readonly className?: string;
}

export default function MarkdownText({
  text,
  animated = false,
  className,
}: MarkdownTextProps) {
  // 전역 단어 인덱스 카운터 — ref라서 리렌더 없이 동기 증가
  const indexRef = useRef({ current: 0 });
  // text가 바뀌면 카운터 초기화
  indexRef.current.current = 0;

  const content = (
    <div className={className}>
      <ReactMarkdown components={MD_COMPONENTS}>{text}</ReactMarkdown>
    </div>
  );

  // animated=true 이면 WordIndexContext Provider로 감싸 커스텀 컴포넌트에 카운터 공유
  return animated ? (
    <WordIndexContext.Provider value={indexRef.current}>
      {content}
    </WordIndexContext.Provider>
  ) : (
    content
  );
}
```

- [ ] **Step 2: 확인**

파일이 `client/src/components/MarkdownText.tsx`에 생성되었는지 확인.

---

## Task 3: PracticeResult AI 리포트 교체

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

- [ ] **Step 1: import 교체**

```tsx
// 제거
import { useAiText } from "../hooks/useAiText";

// 추가
import MarkdownText from "../components/MarkdownText";
```

- [ ] **Step 2: `calcAiAnimDuration` 상수 확인**

`calcAiAnimDuration` 함수는 카드 등장 타이밍 계산에 여전히 필요하므로 그대로 유지. `useAiText` 관련 코드만 제거.

- [ ] **Step 3: `aiTextRef` 및 `useAiText` 호출 제거**

아래 코드 블록 전체 제거:
```tsx
// AI 텍스트 단어 fade-in 훅 — 실패 시 undefined로 훅 비활성
const aiTextRef = useAiText(
  typeof aiComment === "string" ? aiComment : undefined,
  { startDelay: 200 },
);
```

- [ ] **Step 4: 렌더링 교체**

```tsx
// 변경 전
<p ref={aiTextRef} className="text-body leading-relaxed mb-6" />

// 변경 후
<MarkdownText
  text={aiComment}
  animated
  className="text-body leading-relaxed mb-6"
/>
```

- [ ] **Step 5: 확인**

`PracticeResult.tsx`에 `useAiText` import 및 `aiTextRef` 참조가 없는지 확인.

---

## Task 4: PracticeFeedbackBar 해설 교체

**Files:**
- Modify: `client/src/components/PracticeFeedbackBar.tsx`

- [ ] **Step 1: import 추가**

파일 상단에 추가:
```tsx
import MarkdownText from "./MarkdownText";
```

- [ ] **Step 2: rationale 렌더링 교체**

```tsx
// 변경 전
{result.rationale && (
  <p className="text-sm leading-relaxed mb-5 feedback-bar-rationale">
    {result.rationale}
  </p>
)}

// 변경 후
{result.rationale && (
  <MarkdownText
    text={result.rationale}
    className="text-sm leading-relaxed mb-5 feedback-bar-rationale"
  />
)}
```

해설은 바로 표시가 자연스러우므로 `animated` 없이 정적 렌더링.

- [ ] **Step 3: 확인**

`PracticeFeedbackBar.tsx`에 `{result.rationale}` plain text 렌더링이 없는지 확인.

---

## Task 5: QuestionDetail stem 렌더링 통일

**Files:**
- Modify: `client/src/pages/QuestionDetail.tsx`

- [ ] **Step 1: import 교체**

```tsx
// 제거
import ReactMarkdown from "react-markdown";

// 추가
import MarkdownText from "../components/MarkdownText";
```

- [ ] **Step 2: stemPreview 함수 유지 확인**

`stemPreview` 함수는 접힌 상태 미리보기용이므로 그대로 유지.

- [ ] **Step 3: 렌더링 교체**

```tsx
// 변경 전
<div className="text-sm text-body min-w-0 w-full">
  <ReactMarkdown
    components={{
      code({ children, className }) {
        const isBlock = className?.includes("language-");
        return isBlock ? (
          <pre className="bg-surface-code rounded-lg px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word font-mono">
            <code>{children}</code>
          </pre>
        ) : (
          <code className="bg-surface-code px-1 rounded text-xs font-mono">
            {children}
          </code>
        );
      },
    }}
  >
    {question.stem}
  </ReactMarkdown>
</div>

// 변경 후
<MarkdownText
  text={question.stem}
  className="text-sm text-body min-w-0 w-full"
/>
```

- [ ] **Step 4: 확인**

`QuestionDetail.tsx`에 `ReactMarkdown` import 및 사용이 없는지 확인.

---

## Task 6: useAiText 훅 삭제

**Files:**
- Delete: `client/src/hooks/useAiText.ts`

- [ ] **Step 1: 잔여 참조 확인**

```bash
grep -r "useAiText" client/src/
```

결과가 없어야 함. 있으면 해당 파일에서 제거 후 삭제.

- [ ] **Step 2: 파일 삭제 사용자 확인**

`useAiText.ts` 삭제는 사용자 허락 후 진행 (CLAUDE.md 규칙).

---

## Task 7: 동작 확인

- [ ] **Step 1: 개발 서버 기동 여부 확인**

프로젝트 특성상 빌드/실행은 사용자가 직접 수행. 구현 완료 후 사용자에게 다음을 확인 요청:

1. `PracticeResult` 화면 → AI 리포트 텍스트가 Markdown 렌더링되며 단어별 fade-in 동작
2. `PracticeFeedbackBar` → 해설 텍스트에 `**굵게**`, `` `코드` `` 등이 렌더링됨
3. `QuestionDetail` → 문제 지문 Markdown 렌더링 동일하게 동작 (기존과 시각적으로 동일해야 함)
4. 문제 지문 접힘/펼침 토글 정상 동작

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd client && npx tsc --noEmit
```
