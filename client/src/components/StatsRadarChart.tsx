import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { TopicStat } from "../types/api";

interface StatsRadarChartProps {
  readonly topicStats: readonly TopicStat[];
}

export default function StatsRadarChart({ topicStats }: StatsRadarChartProps) {
  const data = topicStats.map((stat) => ({
    subject: stat.displayName,
    value: Math.round(stat.correctRate * 100),
  }));

  return (
    <div className="card-base">
      <h2 className="text-base font-bold text-text-primary mb-4">토픽별 분석</h2>
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
