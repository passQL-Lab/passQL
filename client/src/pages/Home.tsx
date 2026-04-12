import { Flame, ChevronRight, Check, RefreshCw, Sparkles } from "lucide-react";
import { getReadinessCopy } from "../constants/readinessCopy";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMember } from "../hooks/useMember";
import { useMemberStore } from "../stores/memberStore";
import { StarRating } from "../components/StarRating";
import { HeatmapCalendar } from "../components/HeatmapCalendar";
import {
  useGreeting,
  useTodayQuestion,
  useRecommendations,
  useSelectedSchedule,
  useHeatmap,
} from "../hooks/useHome";
import { useStagger } from "../hooks/useStagger";

/**
 * greeting 메시지의 {nickname}을 강조 span으로 치환하고
 * \n 기준으로 줄을 분리한 ReactNode 배열을 반환한다.
 * 닉네임 강조는 백엔드 플레이스홀더 위치를 그대로 사용 — 프론트 비즈니스 로직 최소화.
 */
function parseGreetingLines(message: string, nickname: string): React.ReactNode[] {
  const lines = message.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split("{nickname}");
    if (parts.length === 1) return <span key={lineIdx}>{line}</span>;
    return (
      <span key={lineIdx}>
        {parts[0]}
        <span className="greeting-nickname">{nickname}</span>
        {parts[1]}
      </span>
    );
  });
}

export default function Home() {
  const stagger = useStagger();
  // 각 섹션의 stagger 결과를 미리 선언 — 동일 인덱스 이중 호출 방지
  const s0 = stagger(0); // 그리팅 줄1
  const s1 = stagger(1); // 그리팅 줄2 + 서브메시지
  const s2 = stagger(2); // 오늘의 문제 + 시험 일정
  const s3 = stagger(3); // 학습 현황
  const s4 = stagger(4); // 합격 준비도 / 통계
  const s5 = stagger(5); // AI 추천문제

  // 각 훅의 상태를 개별 구조분해 — 섹션별 독립 에러/로딩 처리를 위해
  const {
    data: progress,
    isLoading: progressLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useProgress();
  useMember();
  const { data: greeting } = useGreeting();
  const { data: today } = useTodayQuestion();
  const { data: recommendations, isError: recommendationsError } = useRecommendations();
  const { data: schedule } = useSelectedSchedule();
  const {
    data: heatmap,
    isLoading: heatmapLoading,
    isError: heatmapError,
    refetch: refetchHeatmap,
  } = useHeatmap();

  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const displayName = nickname || uuid.slice(0, 8);

  // progress 에러/미로드 시 0으로 안전하게 fallback
  const solved = progress?.solvedCount ?? 0;
  const correctRate = progress?.correctRate ?? 0;
  const streak = progress?.streakDays ?? 0;

  return (
    <div className="py-6 space-y-0">
      {/* ① 그리팅 줄1: 첫 번째 줄만 렌더링 */}
      {/* CSS variable(--stagger-delay) 주입 — Tailwind로 표현 불가하여 style prop 예외 허용 */}
      <section className={`mb-1 ${s0.className}`} style={s0.style}>
        <h1 className="text-h2 leading-snug">
          {greeting ? (
            parseGreetingLines(greeting.message, greeting.nickname).map((line, i) =>
              i === 0 ? <span key={i} className="block">{line}</span> : null
            )
          ) : (
            <span>안녕하세요, {displayName}</span>
          )}
        </h1>
      </section>

      {/* ② 그리팅 줄2 + 서브메시지(EXAM_DAY/URGENT) */}
      <section className={`mb-6 ${s1.className}`} style={s1.style}>
        <h1 className="text-h2 leading-snug">
          {greeting &&
            parseGreetingLines(greeting.message, greeting.nickname).map((line, i) =>
              i > 0 ? <span key={i} className="block">{line}</span> : null
            )}
        </h1>
        {greeting?.messageType === "EXAM_DAY" && (
          <p className="text-sm font-medium mt-1 text-sem-error-text">
            오늘 시험이에요!
          </p>
        )}
        {greeting?.messageType === "URGENT" && (
          <p className="text-sm font-medium mt-1 text-sem-warning-text">
            시험이 얼마 남지 않았어요
          </p>
        )}
      </section>

      {/* ③ 오늘의 문제 + 시험 일정 카드 섹션 */}
      <section className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 ${s2.className}`} style={s2.style}>
        {today?.question ? (
          today.alreadySolvedToday ? (
            // 완료 상태: 성공 카드 스타일 (초록 left border + 배경)
            <div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-sem-success-light border-l-4 border-sem-success">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-sem-success-text">
                  오늘의 문제
                </p>
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-sem-success">
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
              <div className="card-base shadow-sm h-full flex flex-col gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
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
            <div className="card-base shadow-sm h-full flex flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
              <p className="text-secondary text-sm">AI문제 풀기</p>
              <p className="text-body text-sm">SQL AI문제를 풀어보세요</p>
            </div>
          </Link>
        )}

        {schedule ? (
          <div className="card-base shadow-sm h-full flex flex-col justify-center">
            <p className="text-secondary text-sm">
              {schedule.certType} {schedule.round}회
            </p>
            <p className="text-h2 text-brand mt-1">{schedule.examDate}</p>
          </div>
        ) : (
          <div className="card-base shadow-sm h-full flex flex-col justify-center">
            <p className="text-secondary text-sm">시험 일정</p>
            <p className="text-caption">선택된 일정 없음</p>
          </div>
        )}
      </section>

      {/* ④ 학습 현황 섹션: heatmap 에러/로딩만 독립 처리 */}
      <section className={`card-base shadow-sm mb-4 ${s3.className}`} style={s3.style}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-secondary text-sm">학습 현황</h2>
          {/* streak는 progress 에러 시 0 fallback → 뱃지 자연스럽게 미표시 */}
          {streak > 0 && (
            <span className="badge badge-warning badge-soft font-bold gap-1">
              {/* fill 속성으로 불꽃 아이콘을 꽉 채운 스타일로 표시 */}
              <Flame size={14} fill="currentColor" />
              연속 {streak}일
            </span>
          )}
        </div>

        {/* 히트맵: 에러 시 해당 영역만 인라인 에러 표시 */}
        {heatmapLoading ? (
          <div className="skeleton h-16" />
        ) : heatmapError ? (
          <div className="h-16 flex items-center justify-between px-1">
            <p className="text-caption text-sm">히트맵을 불러올 수 없습니다</p>
            <button
              type="button"
              className="btn-compact inline-flex items-center gap-1 text-xs"
              onClick={() => refetchHeatmap()}
            >
              <RefreshCw size={12} />
              재시도
            </button>
          </div>
        ) : heatmap ? (
          <HeatmapCalendar entries={heatmap.entries} />
        ) : (
          <div className="skeleton h-16" />
        )}
      </section>

      {/* ⑤ 합격 준비도 / 통계 섹션: progress 에러/로딩 독립 처리 */}
      {progressLoading ? (
        <section className={`grid grid-cols-2 gap-3 mb-4 ${s4.className}`} style={s4.style}>
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </section>
      ) : progressError ? (
        // progress 에러 시 해당 섹션만 인라인 에러 + 재시도 버튼
        <section className={`card-base mb-4 flex items-center justify-between ${s4.className}`} style={s4.style}>
          <p className="text-secondary text-sm">학습 데이터를 불러올 수 없습니다</p>
          <button
            type="button"
            className="btn-compact inline-flex items-center gap-1 text-xs"
            onClick={() => refetchProgress()}
          >
            <RefreshCw size={12} />
            재시도
          </button>
        </section>
      ) : progress?.readiness ? (
        // readiness 데이터가 있으면 합격 준비도 카드
        <section className={`card-base shadow-sm mb-4 ${s4.className}`} style={s4.style}>
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
        // readiness 없으면 간략 통계 카드
        <section className={`grid grid-cols-2 gap-3 mb-4 ${s4.className}`} style={s4.style}>
          <div className="card-base shadow-sm flex flex-col items-start">
            <span className="text-h1 text-brand">{solved}</span>
            <span className="text-secondary mt-1">푼 문제</span>
          </div>
          <div className="card-base shadow-sm flex flex-col items-start">
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

      {/* ⑥ 추천 문제 섹션: 에러 또는 데이터 없으면 섹션 전체 숨김 */}
      {!recommendationsError && recommendations && recommendations.questions.length > 0 && (
        <section className={`mt-6 ${s5.className}`} style={s5.style}>
          {/* Sparkles 아이콘으로 AI 추천 기능임을 명시 */}
          <h2 className="text-secondary text-sm mb-3 flex items-center gap-1">
            <Sparkles size={14} fill="currentColor" />
            AI 추천문제
          </h2>
          <div className="space-y-3">
            {recommendations.questions.map((q) => (
              <Link key={q.questionUuid} to={`/recommendation/${q.questionUuid}`} className="block">
                <div className="card-base shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
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
