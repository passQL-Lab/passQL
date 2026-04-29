import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { useDailySetStore } from "../stores/dailySetStore";
import { useLeaderboard } from "../hooks/useHome";

export default function DailySetResult() {
  const navigate = useNavigate();
  const store = useDailySetStore();
  const { data: leaderboard } = useLeaderboard();

  // correctCount는 complete API 호출 시 저장된 값, 없으면 results에서 직접 집계
  const correctCount = store.correctCount ?? store.results.filter((r) => r.isCorrect).length;
  const totalCount = store.results.length;

  return (
    <div className="flex flex-col min-h-screen max-w-120 mx-auto w-full px-4 py-8 gap-6">
      <div className="text-center">
        <p className="text-sm text-text-secondary mb-1">오늘의 데일리 세트 완료</p>
        <p className="text-4xl font-bold text-brand">
          {correctCount} <span className="text-2xl text-text-secondary font-normal">/ {totalCount}</span>
        </p>
        <p className="text-sm text-text-secondary mt-1">정답</p>
      </div>

      <div className="bg-surface-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-secondary mb-3">문제별 결과</p>
        <div className="flex flex-col gap-2">
          {store.results.map((r, i) => (
            <div key={r.questionUuid} className="flex items-center gap-3">
              <span className="text-xs text-text-caption w-6">{i + 1}</span>
              {r.isCorrect
                ? <CheckCircle size={16} className="text-sem-success-text flex-shrink-0" />
                : <XCircle size={16} className="text-sem-error-text flex-shrink-0" />}
              <span className={`text-sm ${r.isCorrect ? "text-text-primary" : "text-text-secondary"}`}>
                {r.isCorrect ? "정답" : "오답"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {leaderboard && (
        <div className="bg-surface-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-secondary flex items-center gap-1">
              <Trophy size={14} />
              오늘의 순위
            </p>
            {leaderboard.myEntry && (
              <span className="text-xs text-brand font-semibold">내 순위 {leaderboard.myEntry.rank}위</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {leaderboard.entries.slice(0, 3).map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between text-sm">
                <span className="text-text-caption w-6">{entry.rank}</span>
                <span className="flex-1 text-text-primary">{entry.nickname}</span>
                <span className="text-brand font-semibold">{entry.correctCount}점</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-3 btn-outline text-sm py-2 rounded-xl"
            onClick={() => navigate("/leaderboard")}
          >
            전체 순위 보기
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn-primary py-3 rounded-2xl"
        onClick={() => navigate("/", { replace: true })}
      >
        홈으로 가기
      </button>
    </div>
  );
}
