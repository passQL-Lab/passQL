import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { Check, RotateCcw } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitPractice } from "../api/practice";
import type { PracticeAnalysis } from "../types/api";
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
  const [analysis, setAnalysis] = useState<PracticeAnalysis | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!store.topicCode || store.results.length === 0) return;

    const correctCount = store.results.filter((r) => r.isCorrect).length;
    const totalDurationMs = store.results.reduce((sum, r) => sum + r.durationMs, 0);
    const totalCount = store.results.length;

    const buildFallback = (): PracticeAnalysis => ({
      correctCount,
      totalCount,
      totalDurationMs,
      greeting: correctCount >= 9 ? "완벽해요!" : correctCount >= 7 ? "꽤 잘했어요!" : correctCount >= 5 ? "괜찮아요!" : "다시 도전해봐요!",
      analysis: "INNER JOIN과 테이블 별칭은 이미 익숙하게 쓰고 있어요. 다중 테이블 JOIN 순서도 효율적이에요. 다만 OUTER JOIN에서 NULL 처리가 아직 어색한 것 같아요. LEFT JOIN 결과에서 매칭 안 되는 행을 WHERE로 필터링할 때 실수가 반복됐어요.",
      tip: "LEFT JOIN + WHERE col IS NULL 패턴을 연습해보세요.",
    });

    submitPractice({ topicCode: store.topicCode, results: store.results })
      .then(setAnalysis)
      .catch(() => setAnalysis(buildFallback()));
  }, [store.topicCode, store.results]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-3 border-accent-light border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const totalDuration = formatDuration(analysis.totalDurationMs);
  const avgDuration = analysis.totalCount > 0
    ? formatDuration(Math.round(analysis.totalDurationMs / analysis.totalCount))
    : "0초";

  const step1 = (
    <>
      <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-8">
        {store.topicName}
      </span>
      <ScoreCountUp
        target={analysis.correctCount}
        total={analysis.totalCount}
        onComplete={() => setStatsVisible(true)}
      />
      <p
        className="text-body text-text-secondary mt-2 transition-opacity duration-300"
        style={{ opacity: statsVisible ? 1 : 0 }}
      >
        정답
      </p>
      <div
        className="flex gap-8 mt-8 transition-all duration-400"
        style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(12px)" }}
      >
        <div className="text-center">
          <div className="text-lg font-bold">{analysis.totalCount > 0 ? Math.round((analysis.correctCount / analysis.totalCount) * 100) : 0}%</div>
          <div className="text-xs text-text-caption mt-0.5">정답률</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{totalDuration}</div>
          <div className="text-xs text-text-caption mt-0.5">총 시간</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{avgDuration}</div>
          <div className="text-xs text-text-caption mt-0.5">평균</div>
        </div>
      </div>
    </>
  );

  const step2 = (
    <div className="text-left w-full max-w-[360px]">
      <p className="text-2xl font-bold text-center mb-5">{analysis.greeting}</p>
      {analysis.analysis && (
        <p className="text-body leading-relaxed">{analysis.analysis}</p>
      )}
      {analysis.tip && (
        <div className="mt-5 p-3.5 bg-code rounded-lg text-sm text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Tip</strong> — {analysis.tip}
        </div>
      )}
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
                <Check size={16} className="text-green-500 flex-shrink-0" />
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
    <div className="h-screen max-w-[480px] mx-auto">
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
