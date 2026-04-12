import { type CSSProperties } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TopicStat } from "../types/api";

// 정답률에 따라 막대 색상 결정 (80%↑ 초록, 60%↑ 인디고, 40%↑ 주황, 그 이하 빨강)
function getBarColor(rate: number): string {
  if (rate >= 0.8) return "#22C55E";
  if (rate >= 0.6) return "#4F46E5";
  if (rate >= 0.4) return "#F59E0B";
  return "#EF4444";
}

interface StatsBarChartProps {
  readonly topicStats: readonly TopicStat[];
}

export default function StatsBarChart({ topicStats }: StatsBarChartProps) {
  const data = topicStats.map((stat) => ({
    name: stat.displayName,
    value: stat.solvedCount,
    rate: stat.correctRate,
  }));

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg font-bold mb-4">카테고리별 문제 수</h2>
      <div
        className="w-full [height:var(--chart-h)]"
        style={{ "--chart-h": `${Math.max(256, topicStats.length * 32)}px` } as CSSProperties}
      >
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
