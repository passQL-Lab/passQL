import { Flame, ChevronRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMember } from "../hooks/useMember";
import { useMemberStore } from "../stores/memberStore";
import ErrorFallback from "../components/ErrorFallback";
import { StarRating } from "../components/StarRating";
import { useGreeting, useTodayQuestion, useRecommendations, useSelectedSchedule } from "../hooks/useHome";

export default function Home() {
  const { data: progress, isLoading, isError, refetch } = useProgress();
  useMember();
  const { data: greeting } = useGreeting();
  const { data: today } = useTodayQuestion();
  const { data: recommendations } = useRecommendations();
  const { data: schedule } = useSelectedSchedule();
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

  const solved = progress?.solvedCount ?? 0;
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
        <div>
          <h1 className="text-h2">안녕하세요, {displayName}</h1>
          {greeting?.message && (
            <p className="text-secondary mt-1">{greeting.message}</p>
          )}
        </div>
      </section>

      <section className="mb-4">
        {today?.question ? (
          <Link to={`/questions/${today.question.questionUuid}`}>
            <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-secondary mb-1">
                  {today.alreadySolvedToday ? "오늘의 문제 (완료)" : "오늘의 문제"}
                </p>
                <p className="text-body truncate">{today.question.stemPreview}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-topic">{today.question.topicName}</span>
                  <StarRating level={today.question.difficulty} />
                </div>
              </div>
              <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
            </div>
          </Link>
        ) : (
          <Link to="/questions">
            <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-secondary mb-1">문제 풀기</p>
                <p className="text-body">SQL 문제를 풀어보세요</p>
              </div>
              <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
            </div>
          </Link>
        )}
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

      {schedule && (
        <section className="mb-6">
          <div className="card-base flex items-center gap-3">
            <Calendar size={18} className="text-brand flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-secondary text-sm">{schedule.certType} {schedule.round}회</p>
              <p className="text-body font-bold">{schedule.examDate}</p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{solved}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{Math.round(correctRate * 100)}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div className="h-full rounded-full bg-brand" style={{ width: `${correctRate * 100}%` }} />
          </div>
        </div>
      </section>

      {recommendations && recommendations.questions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-secondary text-sm mb-3">추천 문제</h2>
          <div className="space-y-2">
            {recommendations.questions.map((q) => (
              <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`}>
                <div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-body truncate">{q.stemPreview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-topic">{q.topicName}</span>
                      <StarRating level={q.difficulty} />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-caption flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
