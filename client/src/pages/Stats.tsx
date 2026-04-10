import { useQuery } from "@tanstack/react-query";
import { useProgress } from "../hooks/useProgress";
import { fetchCategoryStats } from "../api/progress";
import ErrorFallback from "../components/ErrorFallback";
import StatsAnalysisCard from "../components/StatsAnalysisCard";
import StatsRadarChart from "../components/StatsRadarChart";
import StatsBarChart from "../components/StatsBarChart";

export default function Stats() {
  const {
    data: progress,
    isLoading: progressLoading,
    isError,
    refetch,
  } = useProgress();
  const { data: categories } = useQuery({
    queryKey: ["categoryStats"],
    queryFn: fetchCategoryStats,
    staleTime: 1000 * 60 * 5,
  });

  const readiness = progress?.readiness;
  const readinessPercent = readiness ? Math.round(readiness.score * 100) : null;

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-20 rounded-xl bg-border animate-pulse" />
        <div className="h-64 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-h1">내 실력, 한눈에</h1>
        <p className="text-secondary mt-1">
          약한 영역을 눌러 바로 연습해보세요
        </p>
      </div>

      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: `${progress?.solvedCount ?? 0}문제`, label: "푼 문제" },
          {
            value:
              readinessPercent != null
                ? `${readinessPercent}%`
                : `${Math.round((progress?.correctRate ?? 0) * 100)}%`,
            label: readinessPercent != null ? "합격 준비도" : "정답률",
          },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {categories && categories.length > 0 ? (
        <>
          <StatsAnalysisCard categories={categories} />
          <StatsRadarChart categories={categories} />
          <StatsBarChart categories={categories} />
        </>
      ) : (
        <div className="card-base text-center py-12">
          <p className="text-text-caption">아직 풀이 기록이 없어요</p>
          <p className="text-xs text-text-caption mt-1">
            문제를 풀면 여기에 실력이 나타나요
          </p>
        </div>
      )}
    </div>
  );
}
