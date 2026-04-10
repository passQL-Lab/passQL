import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { CategoryStats } from "../types/api";

interface StatsRadarChartProps {
  readonly categories: readonly CategoryStats[];
}

export default function StatsRadarChart({ categories }: StatsRadarChartProps) {
  const data = categories.map((cat) => ({
    subject: cat.displayName,
    value: Math.round(cat.correctRate * 100),
  }));

  return (
    <div className="card-base">
      <h2 className="text-lg font-bold mb-4">영역별 분석</h2>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 12, fill: "#6B7280" }}
            />
            <Radar
              dataKey="value"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
