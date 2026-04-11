import { Flame, ChevronRight, Check } from "lucide-react";
import { getReadinessCopy } from "../constants/readinessCopy";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMember } from "../hooks/useMember";
import { useMemberStore } from "../stores/memberStore";
import ErrorFallback from "../components/ErrorFallback";
import { StarRating } from "../components/StarRating";
import { HeatmapCalendar } from "../components/HeatmapCalendar";
import {
  useGreeting,
  useTodayQuestion,
  useRecommendations,
  useSelectedSchedule,
  useHeatmap,
} from "../hooks/useHome";

export default function Home() {
  const { data: progress, isLoading, isError, refetch } = useProgress();
  useMember();
  const { data: greeting } = useGreeting();
  const { data: today } = useTodayQuestion();
  const { data: recommendations } = useRecommendations();
  const { data: schedule } = useSelectedSchedule();
  const { data: heatmap } = useHeatmap();
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const displayName = nickname || uuid.slice(0, 8);

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
      <section className="mb-6">
        <h1 className="text-h2">
          {greeting
            ? greeting.message.replace("{nickname}", greeting.nickname)
            : `안녕하세요, ${displayName}`}
        </h1>
        {greeting?.messageType === "EXAM_DAY" && (
          <p
            className="text-sm font-medium mt-1"
            style={{ color: "var(--color-sem-error-text)" }}
          >
            오늘 시험이에요!
          </p>
        )}
        {greeting?.messageType === "URGENT" && (
          <p
            className="text-sm font-medium mt-1"
            style={{ color: "var(--color-sem-warning-text)" }}
          >
            시험이 얼마 남지 않았어요
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {today?.question ? (
          today.alreadySolvedToday ? (
            // 완료 상태: 성공 카드 스타일 (초록 left border + 배경)
            <div
              className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default"
              style={{
                backgroundColor: "var(--color-sem-success-light)",
                borderLeft: "4px solid var(--color-sem-success)",
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-sem-success-text)" }}
                >
                  오늘의 문제
                </p>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--color-sem-success)" }}
                >
                  <Check size={14} className="text-white" />
                </div>
              </div>
              <p className="text-body text-sm truncate">
                {today.question.stemPreview}
              </p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="badge-topic">{today.question.topicName}</span>
                <StarRating level={today.question.difficulty} />
              </div>
            </div>
          ) : (
            // 미완료 상태: 데일리 챌린지 페이지로 이동
            <Link to="/daily-challenge" className="block">
              <div className="card-base h-full flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors">
                <p className="text-secondary text-sm">오늘의 문제</p>
                <p className="text-body text-sm truncate">
                  {today.question.stemPreview}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="badge-topic">
                    {today.question.topicName}
                  </span>
                  <StarRating level={today.question.difficulty} />
                </div>
              </div>
            </Link>
          )
        ) : (
          <Link to="/questions" className="block">
            <div className="card-base h-full flex flex-col justify-center cursor-pointer hover:bg-surface transition-colors">
              <p className="text-secondary text-sm">문제 풀기</p>
              <p className="text-body text-sm">SQL 문제를 풀어보세요</p>
            </div>
          </Link>
        )}

        {schedule ? (
          <div className="card-base h-full flex flex-col justify-center">
            <p className="text-secondary text-sm">
              {schedule.certType} {schedule.round}회
            </p>
            <p className="text-h2 text-brand mt-1">{schedule.examDate}</p>
          </div>
        ) : (
          <div className="card-base h-full flex flex-col justify-center">
            <p className="text-secondary text-sm">시험 일정</p>
            <p className="text-caption">선택된 일정 없음</p>
          </div>
        )}
      </section>

      <section className="card-base mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-secondary text-sm">학습 현황</h2>
          {streak > 0 && (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-sem-warning-light)",
                color: "var(--color-sem-warning-text)",
              }}
            >
              {/* fill 속성으로 불꽃 아이콘을 꽉 채운 스타일로 표시 */}
              <Flame size={14} className="inline mr-1" fill="currentColor" />
              연속 {streak}일
            </span>
          )}
        </div>
        {heatmap ? (
          <HeatmapCalendar entries={heatmap.entries} />
        ) : (
          <div className="h-16 bg-border animate-pulse rounded" />
        )}
      </section>

      {progress?.readiness ? (
        <section className="card-base mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-secondary text-sm">합격 준비도</h2>
            <span className="text-h1 text-brand">
              {Math.round(progress.readiness.score * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border mb-3">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress.readiness.score * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary">
            {getReadinessCopy(
              progress.readiness.toneKey,
              progress.readiness.score,
            )}
          </p>
          <div className="flex gap-4 mt-3 text-xs text-text-caption">
            <span>정확도 {Math.round(progress.readiness.accuracy * 100)}%</span>
            <span>
              커버리지 {Math.round(progress.readiness.coverage * 100)}%
            </span>
            <span>최근도 {Math.round(progress.readiness.recency * 100)}%</span>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-base flex flex-col items-start">
            <span className="text-h1 text-brand">{solved}</span>
            <span className="text-secondary mt-1">푼 문제</span>
          </div>
          <div className="card-base flex flex-col items-start">
            <span className="text-h1 text-brand">
              {Math.round(correctRate * 100)}%
            </span>
            <span className="text-secondary mt-1">정답률</span>
            <div className="w-full mt-2 h-1 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${correctRate * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

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
                  <ChevronRight
                    size={16}
                    className="text-text-caption shrink-0"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
