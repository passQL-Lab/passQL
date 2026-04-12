import { Sparkles } from "lucide-react";
import { useAiText } from "../hooks/useAiText";

interface StatsAnalysisCardProps {
  readonly comment: string | null;
  readonly isLoading?: boolean;
}

export default function StatsAnalysisCard({ comment, isLoading }: StatsAnalysisCardProps) {
  const textRef = useAiText(comment);

  if (isLoading) {
    return (
      <div className="card-base flex gap-3">
        <div className="w-7 h-7 rounded-lg bg-border animate-pulse shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-border rounded animate-pulse w-1/4" />
          <div className="h-3 bg-border rounded animate-pulse w-full" />
          <div className="h-3 bg-border rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!comment) return null;

  return (
    <div className="card-base">
      {/* 아이콘 + 제목 한 줄 */}
      <div className="animate-ai-header flex items-center gap-1 mb-2">
        <div className="animate-sparkle-pop w-7 h-7 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-brand" />
        </div>
        <h3 className="text-base font-bold text-text-primary">AI 한마디</h3>
      </div>
      {/* 단어 단위 fade-in — useAiText 훅이 ref를 통해 DOM 직접 조작 */}
      <p
        ref={textRef}
        className="text-sm text-text-secondary leading-relaxed"
      />
    </div>
  );
}
