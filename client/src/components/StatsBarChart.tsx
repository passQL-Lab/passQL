import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CategoryStats } from "../types/api";

function getBarColor(rate: number): string {
  if (rate >= 0.8) return "#22C55E";
  if (rate >= 0.6) return "#4F46E5";
  if (rate >= 0.4) return "#F59E0B";
  return "#EF4444";
}

interface StatsBarChartProps {
  readonly categories: readonly CategoryStats[];
}

export default function StatsBarChart({ categories }: StatsBarChartProps) {
  const data = categories.map((cat) => ({
    name: cat.displayName,
    value: cat.solvedCount,
    rate: cat.correctRate,
  }));

  return (
    <div className="card-base">
      <h2 className="text-lg font-bold mb-4">카테고리별 문제 수</h2>
      <div className="w-full" style={{ height: Math.max(256, categories.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              width={70}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={getBarColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
