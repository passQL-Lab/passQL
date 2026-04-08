import { useProgress } from "../hooks/useProgress";
import ErrorFallback from "../components/ErrorFallback";

export default function Stats() {
  const { data: progress, isLoading: progressLoading, isError, refetch } = useProgress();

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-48 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-h1 mb-6">학습 통계</h1>
      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: String(progress?.solvedCount ?? 0), label: "푼 문제" },
          { value: `${Math.round((progress?.correctRate ?? 0) * 100)}%`, label: "정답률" },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
