import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { useLeaderboard } from "../hooks/useHome";
import { useAuthStore } from "../stores/authStore";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { data: leaderboard, isLoading } = useLeaderboard();
  // authStore에 nickname 필드 존재 (string | null) — 내 항목 강조 표시에 활용
  const nickname = useAuthStore((s) => s.nickname);

  return (
    <div className="flex flex-col min-h-screen max-w-120 mx-auto w-full">
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 items-center">
          <button
            type="button"
            className="justify-self-start w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <span className="text-sm font-semibold text-text-secondary text-center">오늘의 순위</span>
          <div />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading && (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {leaderboard && (
          <>
            <p className="text-xs text-text-caption text-center mt-2 mb-4">
              {leaderboard.date} 기준 · 정답 수 순
            </p>

            {leaderboard.myEntry && (
              <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand">내 순위</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary">{leaderboard.myEntry.correctCount}점</span>
                  <span className="text-lg font-bold text-brand">{leaderboard.myEntry.rank}위</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {leaderboard.entries.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    nickname && entry.nickname === nickname
                      ? "bg-brand/5 border-brand/20"
                      : "bg-surface-card border-border"
                  }`}
                >
                  <span className={`w-8 text-center font-bold text-sm ${
                    entry.rank === 1 ? "text-yellow-500" :
                    entry.rank === 2 ? "text-gray-400" :
                    entry.rank === 3 ? "text-amber-600" : "text-text-caption"
                  }`}>
                    {/* 상위 3위는 트로피 아이콘, 그 외는 순위 숫자 표시 */}
                    {entry.rank <= 3 ? <Trophy size={16} className="mx-auto" /> : entry.rank}
                  </span>
                  <span className="flex-1 text-sm text-text-primary">{entry.nickname}</span>
                  <span className="text-sm font-semibold text-brand">{entry.correctCount}점</span>
                </div>
              ))}
            </div>

            {leaderboard.entries.length === 0 && (
              <p className="text-center text-text-secondary text-sm mt-20">
                아직 완료한 사람이 없어요
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
