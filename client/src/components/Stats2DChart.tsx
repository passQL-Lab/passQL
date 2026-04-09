import type { CategoryStats } from "../types/api";

function getColorClass(rate: number): string {
  if (rate >= 0.8) return "bg-green-500";
  if (rate >= 0.6) return "bg-brand";
  if (rate >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

function getTextColorClass(rate: number): string {
  if (rate >= 0.8) return "text-green-600";
  if (rate >= 0.6) return "text-brand";
  if (rate >= 0.4) return "text-amber-600";
  return "text-red-600";
}

interface Stats2DChartProps {
  readonly categories: readonly CategoryStats[];
  readonly onCategoryClick?: (code: string) => void;
}

export default function Stats2DChart({ categories, onCategoryClick }: Stats2DChartProps) {
  const sorted = [...categories].sort((a, b) => b.correctRate - a.correctRate);

  return (
    <div className="space-y-3">
      {sorted.map((cat) => (
        <button
          key={cat.code}
          type="button"
          className="w-full text-left card-base flex items-center gap-4 hover:border-brand transition-colors cursor-pointer"
          onClick={() => onCategoryClick?.(cat.code)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{cat.displayName}</span>
              <span className={`text-sm font-bold ${getTextColorClass(cat.correctRate)}`}>
                {Math.round(cat.correctRate * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getColorClass(cat.correctRate)}`}
                style={{ width: `${cat.correctRate * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-caption mt-1">{cat.solvedCount}문제 풀이</p>
          </div>
        </button>
      ))}
    </div>
  );
}
