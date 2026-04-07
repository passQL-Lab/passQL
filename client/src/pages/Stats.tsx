import { useProgress, useHeatmap } from "../hooks/useProgress";

function getHeatmapStyle(rate: number): { bg: string; text: string } {
  if (rate >= 86) return { bg: "#4F46E5", text: "#FFFFFF" };
  if (rate >= 71) return { bg: "#818CF8", text: "#FFFFFF" };
  if (rate >= 51) return { bg: "#C7D2FE", text: "#4F46E5" };
  if (rate >= 31) return { bg: "#EEF2FF", text: "#4F46E5" };
  return { bg: "#F5F5F5", text: "#6B7280" };
}

export default function Stats() {
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap();

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-48 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: String(progress?.solved ?? 0), label: "푼 문제" },
          { value: `${Math.round(progress?.correctRate ?? 0)}%`, label: "정답률" },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {!heatmapLoading && heatmap && heatmap.length > 0 && (
        <section>
          <h2 className="text-h2 mb-4">토픽별 숙련도</h2>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
            {heatmap.map((t) => {
              const style = getHeatmapStyle(t.correctRate);
              return (
                <div
                  key={t.topicCode}
                  className="rounded-lg min-h-[48px] flex flex-col items-center justify-center py-2 px-1"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  <span className="text-[13px] font-bold">{t.topicName}</span>
                  <span className="text-xs">{Math.round(t.correctRate)}%</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
