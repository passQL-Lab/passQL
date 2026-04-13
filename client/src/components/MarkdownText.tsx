import { createContext, isValidElement, useContext, useRef } from "react";
import ReactMarkdown from "react-markdown";

// 전역 단어 인덱스 카운터 — Context로 커스텀 컴포넌트 간 공유
const WordIndexContext = createContext<{ current: number } | null>(null);

/** 단어를 공백 기준으로 쪼개 <span style="--i: N">단어</span> 배열로 변환 */
function splitToAnimatedSpans(
  text: string,
  indexRef: { current: number },
): React.ReactNode[] {
  return text.split(/(\s+)/).map((token, i) => {
    // 공백이거나 빈 문자열은 그대로 — 빈 span 생성 방지
    if (!token || /^\s+$/.test(token)) return token;
    const idx = indexRef.current++;
    return (
      <span key={i} className="md-word" style={{ "--i": idx } as React.CSSProperties}>
        {token}
      </span>
    );
  });
}

/**
 * children을 순서대로 순회하며 애니메이션 처리
 * - string: 단어 단위 span으로 분해
 * - MdInlineCode element: 코드 전체를 단어 1개로 취급해 md-word span으로 교체
 *   (MdInlineCode 렌더 시점에 인덱스를 소비하면 순서가 어긋남 — 여기서 미리 처리)
 * - 그 외 React element: 그대로 반환 (MdStrong 등은 자체적으로 처리)
 */
function animateTextNodes(
  children: React.ReactNode,
  indexRef: { current: number },
): React.ReactNode {
  if (Array.isArray(children)) {
    return children.map((child) => animateTextNodes(child, indexRef));
  }
  if (typeof children === "string") {
    return splitToAnimatedSpans(children, indexRef);
  }
  if (isValidElement(children)) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>;
    // MdInlineCode: 코드 전체를 단어 1개로 취급
    // 여기서 인덱스 소비 안 하면 string 처리 후 나중에 렌더되어 순서 역전 발생
    if (el.type === MdInlineCode) {
      const idx = indexRef.current++;
      return (
        <span key={idx} className="md-word" style={{ "--i": idx } as React.CSSProperties}>
          {children}
        </span>
      );
    }
  }
  return children;
}

// ── 커스텀 Markdown 요소 컴포넌트 ──────────────────────────────

function MdP({ children }: { children?: React.ReactNode }) {
  const indexRef = useContext(WordIndexContext);
  const content = indexRef ? animateTextNodes(children, indexRef) : children;
  return <p className="text-body leading-relaxed mb-2 last:mb-0">{content}</p>;
}

function MdStrong({ children }: { children?: React.ReactNode }) {
  const indexRef = useContext(WordIndexContext);
  const content = indexRef ? animateTextNodes(children, indexRef) : children;
  return <strong className="font-bold">{content}</strong>;
}

function MdEm({ children }: { children?: React.ReactNode }) {
  const indexRef = useContext(WordIndexContext);
  const content = indexRef ? animateTextNodes(children, indexRef) : children;
  return <em className="italic">{content}</em>;
}

function MdInlineCode({ children }: { children?: React.ReactNode }) {
  // 인덱스 소비는 부모(MdP, MdLi 등)의 animateTextNodes에서 처리
  // 이 컴포넌트는 스타일만 담당
  return (
    <code className="bg-surface-code px-1 rounded text-xs font-mono">{children}</code>
  );
}

function MdPre({ children }: { children?: React.ReactNode }) {
  // 코드 블록은 애니메이션 없이 그대로 — 들여쓰기/포맷 보호
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
  const indexRef = useContext(WordIndexContext);
  const content = indexRef ? animateTextNodes(children, indexRef) : children;
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
  const indexRef = useRef({ current: 0 });
  // text가 바뀌면 카운터 초기화
  indexRef.current.current = 0;

  const content = (
    <div className={className}>
      <ReactMarkdown components={MD_COMPONENTS}>{text}</ReactMarkdown>
    </div>
  );

  return animated ? (
    <WordIndexContext.Provider value={indexRef.current}>
      {content}
    </WordIndexContext.Provider>
  ) : (
    content
  );
}
