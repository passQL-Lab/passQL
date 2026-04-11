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
        <div className="bg-surface-card rounded-t-2xl md:rounded-xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
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
