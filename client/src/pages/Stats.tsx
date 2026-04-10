import { useQuery } from "@tanstack/react-query";
import { useProgress } from "../hooks/useProgress";
import { fetchTopicAnalysis, fetchAiComment } from "../api/progress";
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

  // 토픽별 정답률/풀이 수 (레이더·막대 차트)
  const { data: topicAnalysis } = useQuery({
    queryKey: ["topicAnalysis"],
    queryFn: fetchTopicAnalysis,
    staleTime: 1000 * 60 * 5,
  });

  // AI 코멘트 (Redis 24h 캐싱 — 제출 시 서버에서 자동 무효화)
  const { data: aiComment, isLoading: aiCommentLoading } = useQuery({
    queryKey: ["aiComment"],
    queryFn: fetchAiComment,
    staleTime: 1000 * 60 * 60, // 1시간 — 서버 캐시 TTL(24h) 내에서는 재요청 불필요
  });

  const readiness = progress?.readiness;
  const readinessPercent = readiness ? Math.round(readiness.score * 100) : null;
  const topicStats = topicAnalysis?.topicStats ?? [];

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

      {/* 상단 요약 카드 */}
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

      {topicStats.length > 0 ? (
        <>
          {/* AI 영역 분석 코멘트 */}
          <StatsAnalysisCard
            comment={aiComment?.comment ?? null}
            isLoading={aiCommentLoading}
          />
          <StatsRadarChart topicStats={topicStats} />
          <StatsBarChart topicStats={topicStats} />
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
