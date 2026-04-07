import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMember } from "../hooks/useMember";
import { useMemberStore } from "../stores/memberStore";
import ErrorFallback from "../components/ErrorFallback";

export default function Home() {
  const { data: progress, isLoading, isError, refetch } = useProgress();
  useMember();
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const displayName = nickname || uuid.slice(0, 8);
  const initials = displayName.slice(0, 2);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-10 w-48 rounded bg-border animate-pulse" />
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-border animate-pulse" />
          <div className="h-24 rounded-xl bg-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  const solved = progress?.solved ?? 0;
  const correctRate = progress?.correctRate ?? 0;
  const streak = progress?.streakDays ?? 0;

  return (
    <div className="py-6 space-y-0">
      <section className="flex items-center gap-3 mb-8">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {initials}
        </div>
        <h1 className="text-h2">안녕하세요, {displayName}</h1>
      </section>

      {streak > 0 && (
        <section className="mb-6">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-sem-warning-light)",
              color: "var(--color-sem-warning-text)",
            }}
          >
            <Flame size={16} className="inline" /> 연속 {streak}일
          </span>
        </section>
      )}

      <section className="mb-4">
        <Link to="/questions">
          <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-secondary mb-1">문제 풀기</p>
              <p className="text-body">SQL 문제를 풀어보세요</p>
            </div>
            <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{solved}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{Math.round(correctRate)}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div className="h-full rounded-full bg-brand" style={{ width: `${correctRate}%` }} />
          </div>
        </div>
      </section>
    </div>
  );
}
