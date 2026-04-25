import { Flame, ChevronRight, Check, RefreshCw, Sparkles } from "lucide-react";
import { getReadinessCopy } from "../constants/readinessCopy";
import { Link } from "react-router-dom";
import { useState, useCallback, useEffect, type CSSProperties } from "react";
import { useProgress } from "../hooks/useProgress";
import { useMember } from "../hooks/useMember";
import { useAuthStore } from "../stores/authStore";
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
  // 버튼 1회전 트리거 — 애니메이션 클래스를 뗐다 붙이기 위해 별도 state 사용
  const [spinning, setSpinning] = useState(false);
  // 카드 페이드인 재트리거 — key가 바뀌면 카드 목록이 재마운트되어 애니메이션 재실행
  const [refreshKey, setRefreshKey] = useState(0);
  // 세션 내 이미 추천된 UUID 누적 — 새로고침 시 제외 목록으로 전달
  const [seenUuids, setSeenUuids] = useState<string[]>([]);

  const {
    data: recommendations,
    isError: recommendationsError,
    refetch: refetchRecommendations,
    isFetching: recommendationsFetching,
  } = useRecommendations(seenUuids);
  // 추천 결과가 도착하면 해당 UUID를 seenUuids에 누적
  useEffect(() => {
    if (recommendations?.questions && recommendations.questions.length > 0) {
      setSeenUuids((prev) => {
        const newUuids = recommendations.questions
          .map((q) => q.questionUuid)
          .filter((uuid) => !prev.includes(uuid));
        if (newUuids.length === 0) return prev;
        // FIFO 30개 유지 — 무제한 누적 시 POST body 비대화 방지
        return [...prev, ...newUuids].slice(-30);
      });
    }
  }, [recommendations]);
  const { data: schedule } = useSelectedSchedule();
  const {
    data: heatmap,
    isLoading: heatmapLoading,
    isError: heatmapError,
    refetch: refetchHeatmap,
  } = useHeatmap();

  const handleRefresh = useCallback(() => {
    if (recommendationsFetching || spinning) return;
    setSpinning(true);
    refetchRecommendations().then(() => {
      setRefreshKey((k) => k + 1);
    });
  }, [recommendationsFetching, spinning, refetchRecommendations]);

  const uuid = useAuthStore((s) => s.memberUuid ?? "");
  const nickname = useAuthStore((s) => s.nickname ?? "");
  const displayName = nickname || uuid.slice(0, 8);

  // progress 에러/미로드 시 0으로 안전하게 fallback
  const solved = progress?.solvedCount ?? 0;
  const correctRate = progress?.correctRate ?? 0;
  const streak = progress?.streakDays ?? 0;

  return (
    <div className="py-6 space-y-0">
      {/* ① 그리팅 줄1: 첫 번째 줄만 렌더링 */}
      {/* CSS variable(--stagger-delay) 주입 — Tailwind로 표현 불가하여 style prop 예외 허용 */}
      <section className={`mb-1 ${s0.className}`}>
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
      <section className={`mb-6 ${s1.className}`}>
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

      {/* ③ 시험 일정 + 오늘의 문제 카드 섹션 — 시험 일정을 앞에 배치 */}
      <section className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 ${s2.className}`}>
        {schedule ? (
          // 인디고 단색 카드 — D-day를 전면에 강조해 시험 긴박감 전달
          <div className="h-full rounded-xl p-4 sm:p-6 flex flex-col justify-center relative overflow-hidden bg-brand">
            {/* 배경 장식 원 — 단색 배경의 단조로움을 덜어주는 subtle한 레이어 */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
            <p className="text-xs font-medium text-white/70 mb-1 relative z-10">
              {schedule.certType} {schedule.round}회
            </p>
            <p className="text-3xl font-bold text-white leading-tight relative z-10">
              {/* D-day 계산: 오늘 00:00 기준으로 시험일까지 남은 일수 */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const exam = new Date(schedule.examDate);
                exam.setHours(0, 0, 0, 0);
                const diff = Math.round((exam.getTime() - today.getTime()) / 86400000);
                if (diff > 0) return `D-${diff}`;
                if (diff === 0) return "D-Day";
                return `D+${Math.abs(diff)}`;
              })()}
            </p>
            <p className="text-sm text-white/70 mt-1 relative z-10">{schedule.examDate}</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col justify-center">
            <p className="text-sm text-text-secondary">시험 일정</p>
            <p className="text-sm text-text-caption mt-1">선택된 일정 없음</p>
          </div>
        )}

        {today?.question ? (
          today.alreadySolvedToday ? (
            // 완료 상태: 회색 dimmed 카드 — 이미 끝난 항목임을 시각적으로 표현
            <div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-[#F3F4F6] border border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-caption">
                  오늘의 문제
                </p>
                {/* 완료 인디케이터: 원형 아이콘 대신 텍스트 레이블 */}
                <span className="flex items-center gap-1 text-xs font-semibold text-sem-success-text">
                  <Check size={11} strokeWidth={3} />
                  완료
                </span>
              </div>
              <p className="text-text-caption text-sm truncate">
                {today.question.stemPreview}
              </p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="badge-topic opacity-50">{today.question.topicName}</span>
                <span className="opacity-40"><StarRating level={today.question.difficulty} /></span>
              </div>
            </div>
          ) : (
            // 미완료 상태: 데일리 챌린지 페이지로 이동
            <Link to="/daily-challenge" className="block">
              <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col gap-2 cursor-pointer hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
                <p className="text-sm text-text-secondary">오늘의 문제</p>
                <p className="text-sm text-text-primary truncate">
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
            <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col justify-center cursor-pointer hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
              <p className="text-sm text-text-caption">오늘의 문제</p>
              <p className="text-sm text-text-primary mt-1">오늘은 등록된 문제가 없어요</p>
            </div>
          </Link>
        )}
      </section>

      {/* ④ 학습 현황 섹션: heatmap 에러/로딩만 독립 처리 */}
      <section className={`bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mb-4 ${s3.className}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-secondary text-sm">학습 현황</h2>
          {/* streak는 progress 에러 시 0 fallback → 뱃지 자연스럽게 미표시 */}
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-sem-warning-light text-sem-warning-text">
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
          /* 히트맵 영역만 실패 — 카드 구조는 유지하고 영역 안에서 재시도 유도 */
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-text-caption">히트맵을 불러올 수 없습니다</p>
            <button
              type="button"
              className="btn-compact inline-flex items-center gap-1.5"
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
        <section className={`grid grid-cols-2 gap-3 mb-4 ${s4.className}`}>
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </section>
      ) : progressError ? (
        /* progress 에러 — 로딩 skeleton과 동일한 2칸 그리드 자리에 배치해 레이아웃 안정 */
        <section className={`grid grid-cols-2 gap-3 mb-4 ${s4.className}`}>
          <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 text-center col-span-2 py-5">
            <p className="text-sm text-text-caption">학습 데이터를 불러올 수 없습니다</p>
            <button
              type="button"
              className="btn-compact inline-flex items-center gap-1.5"
              onClick={() => refetchProgress()}
            >
              <RefreshCw size={12} />
              재시도
            </button>
          </div>
        </section>
      ) : progress?.readiness ? (
        // readiness 데이터가 있으면 합격 준비도 카드
        <section className={`bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mb-4 ${s4.className}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm text-text-secondary">합격 준비도</h2>
            <span className="text-h1 text-brand">
              {Math.round(progress.readiness.score * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border mb-3">
            <div
              className="h-full rounded-full bg-brand transition-all [width:var(--bar-w)]"
              style={{ "--bar-w": `${progress.readiness.score * 100}%` } as CSSProperties}
            />
          </div>
          <p className="text-sm text-text-secondary">
            {getReadinessCopy(
              progress.readiness.toneKey,
              progress.readiness.score,
            )}
          </p>
          <div className="flex gap-4 mt-3 text-xs text-text-caption">
            <span>맞힌 비율 {Math.round(progress.readiness.accuracy * 100)}%</span>
            <span>
              공부 범위 {Math.round(progress.readiness.coverage * 100)}%
            </span>
            <span>꾸준함 {Math.round(progress.readiness.recency * 100)}%</span>
          </div>
        </section>
      ) : (
        // readiness 없으면 간략 통계 카드
        <section className={`grid grid-cols-2 gap-3 mb-4 ${s4.className}`}>
          <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-start">
            <span className="text-h1 text-brand">{solved}</span>
            <span className="text-sm text-text-secondary mt-1">푼 문제</span>
          </div>
          <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-start">
            <span className="text-h1 text-brand">
              {Math.round(correctRate * 100)}%
            </span>
            <span className="text-sm text-text-secondary mt-1">정답률</span>
            <div className="w-full mt-2 h-1 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand [width:var(--bar-w)]"
                style={{ "--bar-w": `${correctRate * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        </section>
      )}

      {/* ⑥ 추천 문제 섹션: 에러 또는 데이터 없으면 섹션 전체 숨김 */}
      {!recommendationsError && recommendations && recommendations.questions.length > 0 && (
        <section className={`mt-6 ${s5.className}`}>
          {/* Sparkles 아이콘으로 AI 추천 기능임을 명시 */}
          <h2 className="text-secondary text-sm mb-3 flex items-center gap-2">
            <Sparkles size={14} fill="currentColor" />
            AI 추천문제
            {/* 다른 추천 문제 세트를 원할 때 재요청 — staleTime 내에도 강제 refetch */}
            <button
              onClick={handleRefresh}
              disabled={recommendationsFetching || spinning}
              onAnimationEnd={() => setSpinning(false)}
              className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="추천 문제 새로고침"
            >
              <RefreshCw
                size={13}
                className={spinning ? "animate-refresh-once" : ""}
              />
            </button>
          </h2>
          <div key={refreshKey} className="space-y-3">
            {recommendations.questions.map((q) => (
              <Link
                key={q.questionUuid}
                to={`/questions/${q.questionUuid}`}
                className="block animate-card-in"
              >
                <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
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
