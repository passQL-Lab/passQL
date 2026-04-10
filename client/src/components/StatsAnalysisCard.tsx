import { Lightbulb } from "lucide-react";
import type { CategoryStats } from "../types/api";

interface StatsAnalysisCardProps {
  readonly categories: readonly CategoryStats[];
}

function buildAnalysis(categories: readonly CategoryStats[]): string {
  if (categories.length === 0) return "";

  const avgRate =
    categories.reduce((sum, c) => sum + c.correctRate, 0) / categories.length;

  const untried = categories.filter((c) => c.solvedCount === 0);
  const weak = categories.filter(
    (c) => c.solvedCount > 0 && c.correctRate < avgRate,
  );

  const lines: string[] = [];

  if (avgRate >= 0.8) {
    lines.push("전반적으로 높은 수준의 실력을 갖추고 있어요.");
  } else if (avgRate >= 0.5) {
    lines.push("전반적으로 안정적인 실력을 보여주고 있어요.");
  } else {
    lines.push("아직 성장 중이에요. 꾸준히 풀면 금방 늘어요.");
  }

  if (weak.length > 0) {
    const names = weak
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 3)
      .map((c) => c.displayName);
    lines.push(
      `실력을 더 높이고 싶다면 ${names.join(", ")} 카테고리를 집중적으로 학습해보세요.`,
    );
  }

  if (untried.length > 0) {
    const names = untried.slice(0, 3).map((c) => c.displayName);
    lines.push(
      `아직 시도하지 않은 영역이 있어요. ${names.join(", ")}도 한번 풀어보세요.`,
    );
  }

  if (weak.length === 0 && untried.length === 0) {
    lines.push("모든 영역에서 고른 실력을 보여주고 있어요. 이 페이스를 유지하세요!");
  }

  return lines.join(" ");
}

export default function StatsAnalysisCard({ categories }: StatsAnalysisCardProps) {
  const text = buildAnalysis(categories);

  return (
    <div className="card-base flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
        <Lightbulb size={16} className="text-brand" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-1">영역 분석</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
