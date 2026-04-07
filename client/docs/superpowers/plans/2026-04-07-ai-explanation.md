# AI Explanation Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prompt5_AiExplanation.md 스펙대로 AI 해설 모달/바텀시트 컴포넌트를 구현한다. Desktop은 중앙 모달(520px), Mobile은 바텀시트(rounded-t-2xl, drag handle). Loading/Loaded 2가지 상태를 mock으로 보여준다.

**Architecture:** AiExplanationSheet.tsx 공용 컴포넌트를 생성한다. `isOpen`, `onClose` props로 제어한다. 내부에서 mock 타이머로 loading → loaded 전환을 시뮬레이션한다. dialog-overlay, dialog-sheet CSS 클래스를 활용한다.

**Tech Stack:** React 19, Tailwind CSS 4 tokens, 기존 dialog CSS 클래스

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/AiExplanationSheet.tsx` | AI 해설 모달/바텀시트 (loading + loaded 상태) |

---

### Task 1: AiExplanationSheet 컴포넌트 생성

**Files:**
- Create: `src/components/AiExplanationSheet.tsx`

- [ ] **Step 1: AiExplanationSheet.tsx 생성**

```tsx
import { useState, useEffect } from "react";

interface AiExplanationSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const MOCK_EXPLANATION = `선택지 C가 오답인 이유를 분석해 보겠습니다.

**문제점: GROUP BY 절의 컬럼 참조 오류**

선택지 C의 SQL에서는 \`GROUP BY c.name\` 대신 \`GROUP BY name\`을 사용했습니다. 표준 SQL에서는 SELECT 절의 별칭이나 비한정 컬럼명을 GROUP BY에서 사용할 경우, DBMS에 따라 다르게 해석될 수 있습니다.

**올바른 SQL:**
\`\`\`sql
SELECT c.name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY c.name
\`\`\`

**잘못된 SQL:**
\`\`\`sql
SELECT name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY name
\`\`\`

테이블 별칭을 명시적으로 사용하는 것이 안전하며, 특히 여러 테이블을 조인할 때 컬럼의 출처를 명확히 해야 합니다.`;

function renderMarkdown(text: string) {
  const parts: Array<{ readonly type: string; readonly content: string }> = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
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

    // Regular line
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

    // Bold: **text**
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

export default function AiExplanationSheet({ isOpen, onClose }: AiExplanationSheetProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="dialog-overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[80vh] z-50">
        <div className="bg-surface-card rounded-t-2xl md:rounded-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
          {/* Drag handle (mobile) */}
          <div className="md:hidden flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-border-muted" />
          </div>

          {/* Header */}
          <div className="sticky top-0 bg-surface-card flex items-center justify-between px-4 py-3 border-b border-border z-10">
            <h2 className="text-lg font-bold text-text-primary">AI 해설</h2>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            {loading ? <LoadingSkeleton /> : renderMarkdown(MOCK_EXPLANATION)}
          </div>

          {/* Footer */}
          {!loading && (
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

**스펙 체크리스트:**
- ✅ Desktop: 중앙 모달 520px, 80vh max, 24px(rounded-2xl) radius, #111827/50% overlay
- ✅ Mobile: 바텀시트 90% height, rounded-t-2xl, drag handle (40px wide, 4px height, #D1D5DB)
- ✅ Header: sticky, "AI 해설" 18px bold #111827, ✕ close 32px #6B7280 hover #111827, bottom 1px #E5E7EB border
- ✅ Loading: 3 skeleton bars (pulsing, staggered widths 100%/85%/60%), "AI가 분석 중입니다..." 14px #9CA3AF centered
- ✅ Loaded: Markdown rendered — Pretendard 15px #374151 line-height 1.7, bold #111827, inline code JetBrains Mono 13px #F3F4F6 pill, code block full-width 4px #4F46E5 left border, 16px paragraph spacing
- ✅ Footer: "프롬프트 v1 · qwen2.5:7b" 12px #9CA3AF right-aligned
- ✅ Korean text throughout

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/AiExplanationSheet.tsx docs/superpowers/plans/2026-04-07-ai-explanation.md
git commit -m "feat: AI 해설 모달/바텀시트 컴포넌트 구현 (mock 데이터) #9"
```
