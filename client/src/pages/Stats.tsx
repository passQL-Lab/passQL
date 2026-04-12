import { useQuery } from "@tanstack/react-query";
import { useProgress } from "../hooks/useProgress";
import { fetchTopicAnalysis, fetchAiComment } from "../api/progress";
import ErrorFallback from "../components/ErrorFallback";
import StatsAnalysisCard from "../components/StatsAnalysisCard";
import StatsRadarChart from "../components/StatsRadarChart";
import StatsBarChart from "../components/StatsBarChart";
import { useStagger } from "../hooks/useStagger";

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

  // 섹션별 순차 페이드인 딜레이 생성
  const stagger = useStagger();
  const s0 = stagger(0); // 제목 + 서브텍스트
  const s1 = stagger(1); // 상단 요약 카드
  const s2 = stagger(2); // AI 코멘트 or 빈 상태
  const s3 = stagger(3); // 레이더 차트
  const s4 = stagger(4); // 바 차트

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
      {/* CSS variable(--stagger-delay) 주입 — Tailwind로 표현 불가하여 style prop 예외 허용 */}
      {/* ① 제목 + 서브텍스트 */}
      <section className={s0.className} style={s0.style}>
        <h1 className="text-h1">내 실력, 한눈에</h1>
        <p className="text-secondary mt-1">
          약한 영역을 눌러 바로 연습해보세요
        </p>
      </section>

      {/* ② 상단 요약 카드 */}
      <section className={`card-base flex items-center divide-x divide-border ${s1.className}`} style={s1.style}>
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
            <p className="text-h1">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </section>

      {topicStats.length > 0 ? (
        <>
          {/* ③ AI 코멘트 */}
          <section className={s2.className} style={s2.style}>
            <StatsAnalysisCard
              comment={aiComment?.comment ?? null}
              isLoading={aiCommentLoading}
            />
          </section>
          {/* ④ 레이더 차트 */}
          <section className={s3.className} style={s3.style}>
            <StatsRadarChart topicStats={topicStats} />
          </section>
          {/* ⑤ 바 차트 */}
          <section className={s4.className} style={s4.style}>
            <StatsBarChart topicStats={topicStats} />
          </section>
        </>
      ) : (
        <section className={`card-base text-center py-12 ${s2.className}`} style={s2.style}>
          <p className="text-text-caption">아직 풀이 기록이 없어요</p>
          <p className="text-xs text-text-caption mt-1">
            문제를 풀면 여기에 실력이 나타나요
          </p>
        </section>
      )}
    </div>
  );
}
