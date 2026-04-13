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

/** animated=true 시 children 텍스트를 단어 단위 fade-in span으로 변환 */
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
  // 인라인 코드는 단어 분해 없이 통째로 — 코드를 쪼개면 의미 손실
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
  // text가 바뀌면 카운터 초기화 (렌더마다 리셋)
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
