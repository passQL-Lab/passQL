import { Lightbulb } from "lucide-react";

interface StatsAnalysisCardProps {
  // AI가 생성한 코멘트 텍스트. null이면 로딩/미생성 상태
  readonly comment: string | null;
  // 로딩 중 여부 (skeleton 표시)
  readonly isLoading?: boolean;
}

export default function StatsAnalysisCard({ comment, isLoading }: StatsAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="card-base flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-border animate-pulse shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-border rounded animate-pulse w-1/4" />
          <div className="h-3 bg-border rounded animate-pulse w-full" />
          <div className="h-3 bg-border rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // AI 코멘트가 없으면 섹션 자체를 숨김 처리
  if (!comment) return null;

  return (
    <div className="card-base flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
        <Lightbulb size={16} className="text-brand" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-1">AI 영역 분석</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{comment}</p>
      </div>
    </div>
  );
}
