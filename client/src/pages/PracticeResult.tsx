import { useState, useMemo } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, RotateCcw, Target, Clock, Timer } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { fetchAiComment } from "../api/progress";
import ScoreCountUp from "../components/ScoreCountUp";
import StepNavigator from "../components/StepNavigator";

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0초";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${min}분 ${remSec}초` : `${min}분`;
}

export default function PracticeResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();
  // 각 통계 항목의 등장 여부를 인덱스별로 관리 (0: 정답률, 1: 총시간, 2: 문제당 평균)
  const [visibleStats, setVisibleStats] = useState<boolean[]>([false, false, false]);

  // AI 코멘트: useQuery로 캐싱 및 StrictMode 이중 호출 방지
  const { data: aiCommentData, isLoading: aiCommentLoading } = useQuery({
    queryKey: ["aiComment"],
    queryFn: fetchAiComment,
    staleTime: 1000 * 60 * 60 * 24, // 24시간 — Redis 캐시(24h)와 맞춤
  });
  // null=로딩 중, ""=에러/데이터 없음, string=내용
  const aiComment = aiCommentLoading ? null : (aiCommentData?.comment ?? "");

  const analysis = useMemo(() => {
    const results = store.results;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;
    const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);

    return {
      correctCount,
      totalCount,
      totalDurationMs,
      greeting: correctCount >= 9 ? "완벽해요!" : correctCount >= 7 ? "꽤 잘했어요!" : correctCount >= 5 ? "괜찮아요!" : "다시 도전해봐요!",
    };
  }, [store.results]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  const totalDuration = formatDuration(analysis.totalDurationMs);
  const avgDuration = analysis.totalCount > 0
    ? formatDuration(Math.round(analysis.totalDurationMs / analysis.totalCount))
    : "0초";

  // 카운트업 완료 후 150ms 간격으로 순차 등장
  const handleScoreComplete = () => {
    [0, 1, 2].forEach((i) => {
      setTimeout(() => {
        setVisibleStats((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
    });
  };

  const step1 = (
    <>
      <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-8">
        {store.topicName}
      </span>
      <ScoreCountUp
        target={analysis.correctCount}
        total={analysis.totalCount}
        onComplete={handleScoreComplete}
      />
      <p className="text-body text-text-secondary mt-2">
        정답
      </p>
      <div className="flex gap-8 mt-8">
        {/* 정답률 */}
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">{analysis.totalCount > 0 ? Math.round((analysis.correctCount / analysis.totalCount) * 100) : 0}%</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Target size={11} className="text-text-caption" />
            정답률
          </div>
        </div>
        {/* 총 시간 */}
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">{totalDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Clock size={11} className="text-text-caption" />
            총 시간
          </div>
        </div>
        {/* 문제당 평균 */}
        <div className={`text-center transition-all duration-300 ease-out ${visibleStats[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <div className="text-lg font-bold">{avgDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Timer size={11} className="text-text-caption" />
            문제당 평균
          </div>
        </div>
      </div>
    </>
  );

  const step2 = (
    <div className="text-left w-full max-w-90 px-2 sm:px-0">
      <p className="text-2xl font-bold text-center mb-5">{analysis.greeting}</p>
      {/* AI 코멘트: null=로딩, ""=에러, 문자열=내용 */}
      {aiComment === null ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-border rounded w-full" />
          <div className="h-4 bg-border rounded w-5/6" />
          <div className="h-4 bg-border rounded w-4/6" />
        </div>
      ) : aiComment ? (
        <p className="text-body leading-relaxed">{aiComment}</p>
      ) : null}
    </div>
  );

  const step3 = (
    <div className="w-full text-left overflow-y-auto">
      <p className="text-sm font-medium text-text-caption mb-3">문제별 결과</p>
      <div className="flex flex-col gap-2">
        {store.results.map((r, i) => {
          const q = store.questions[i];
          return (
            <div
              key={r.questionUuid}
              className={`flex items-center gap-3 p-3 bg-surface-card border rounded-[10px] ${
                r.isCorrect ? "border-border" : "border-red-300"
              }`}
            >
              <span className={`text-sm font-bold w-5 text-center ${r.isCorrect ? "text-green-600" : "text-red-600"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{q?.stemPreview}</p>
                <p className="text-xs text-text-caption mt-0.5">{formatDuration(r.durationMs)}</p>
              </div>
              {r.isCorrect ? (
                <Check size={16} className="text-green-500 shrink-0" />
              ) : (
                <Link
                  to={`/questions/${r.questionUuid}`}
                  className="flex items-center gap-1 text-xs font-medium text-brand bg-accent-light rounded-md px-2.5 py-1.5"
                >
                  <RotateCcw size={13} /> 다시
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-screen max-w-120 mx-auto px-4 sm:px-0">
      <StepNavigator
        steps={[step1, step2, step3]}
        lastButtonLabel="다른 카테고리"
        onLastStep={() => {
          store.reset();
          navigate("/questions", { replace: true });
        }}
      />
    </div>
  );
}
