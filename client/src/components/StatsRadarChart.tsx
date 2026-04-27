import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
    // 미학습(0%) 토픽을 10으로 표시 — 튀지 않게 낮추되 그물 형태 유지
    value: stat.correctRate === 0 ? 10 : Math.round(stat.correctRate * 100),
  }));

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
      <h2 className="text-base font-bold text-text-primary mb-4">토픽별 분석</h2>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 12, fill: "#6B7280" }}
            />
            {/* domain 고정: 데이터 기반 자동 축소를 막아 항상 0~100 스케일 유지 */}
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
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
