import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  RotateCcw,
  Target,
  Clock,
  Timer,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { useMemberStore } from "../stores/memberStore";
import { fetchAiComment } from "../api/progress";
import MarkdownText from "../components/MarkdownText";
import ScoreCountUp from "../components/ScoreCountUp";
import StepNavigator from "../components/StepNavigator";
import ReportModal from "../components/ReportModal";

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0초";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${min}분 ${remSec}초` : `${min}분`;
}

/** MarkdownText animated 단어 수 기반 총 애니메이션 시간 계산 */
function calcAiAnimDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // startDelay 200ms + 단어 간격 55ms + 마지막 fade 300ms + 여유 300ms
  return 200 + (wordCount - 1) * 55 + 300 + 300;
}

export default function PracticeResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();

  // 다시 풀기 후 복귀 시 step2로 바로 진입 (기존 step3 → 통합 후 step2)
  const initialStepRef = useRef(
    store.returnStep != null ? Math.min(store.returnStep, 1) : 0,
  );
  const initialStep = initialStepRef.current;

  // memberStore에서 UUID 읽기 — ReportModal API 인증에 사용
  const memberUuid = useMemberStore((s) => s.uuid);

  const [visibleStats, setVisibleStats] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 신고 모달 대상 — null이면 모달 닫힘
  const [reportModalTarget, setReportModalTarget] = useState<{
    questionUuid: string;
    submissionUuid: string;
    choiceSetUuid?: string;
  } | null>(null);
  // 신고 완료된 submissionUuid 목록 — 중복 신고 방지
  const [reportedSubmissions, setReportedSubmissions] = useState<Set<string>>(new Set());
  // 신고 접수 토스트 표시 여부 — DOM 조작 대신 React 상태로 관리
  const [showReportToast, setShowReportToast] = useState(false);

  // 문제 카드 순차 등장 상태 — 인덱스별 visible 여부
  const [visibleCards, setVisibleCards] = useState<boolean[]>([]);
  // 문제 리스트 섹션 자체 등장 여부
  const [resultVisible, setResultVisible] = useState(false);

  // 타이머를 역할별로 분리 — scoreComplete 타이머와 AI/카드 타이머가 서로 취소하지 않도록
  const scoreTimerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardTimerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // 신고 토스트 타이머 — 컴포넌트 언마운트 시 클린업
  const toastTimerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.clearReturnStep();
    return () => {
      scoreTimerIdsRef.current.forEach(clearTimeout);
      cardTimerIdsRef.current.forEach(clearTimeout);
      if (toastTimerIdRef.current !== null) clearTimeout(toastTimerIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI 코멘트: sessionId 단위 캐시 — 세션마다 새 피드백
  const {
    data: aiCommentData,
    isLoading: aiCommentLoading,
    isError: aiCommentError,
  } = useQuery({
    queryKey: ["aiComment", sessionId],
    queryFn: () => fetchAiComment(sessionId!),
    staleTime: 1000 * 60 * 60 * 2, // 2시간 — 백엔드 Redis TTL과 맞춤
    enabled: !!sessionId,
    retry: 1,
  });
  // AI 로딩 중: null(스켈레톤), 실패: false(에러 메시지), 성공: 텍스트
  const aiComment: string | null | false = aiCommentLoading
    ? null
    : aiCommentError
      ? false
      : (aiCommentData?.comment ?? "");

  // AI 애니메이션 완료 or 실패 시 문제 카드 순차 등장
  useEffect(() => {
    // 로딩 중이면 대기
    if (aiComment === null) return;
    cardTimerIdsRef.current.forEach(clearTimeout);
    cardTimerIdsRef.current = [];

    // AI 실패 시 즉시 등장, 성공 시 애니메이션 완료 후 등장
    const animDuration =
      typeof aiComment === "string" && aiComment
        ? calcAiAnimDuration(aiComment)
        : 0;
    const cardCount = store.results.length;

    // 문제 리스트 섹션 먼저 등장
    const sectionId = setTimeout(() => {
      setResultVisible(true);
      setVisibleCards(new Array(cardCount).fill(false));
    }, animDuration);
    cardTimerIdsRef.current.push(sectionId);

    // 카드 80ms 간격 순차 등장
    store.results.forEach((_, i) => {
      const id = setTimeout(
        () => {
          setVisibleCards((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        },
        animDuration + 100 + i * 80,
      );
      cardTimerIdsRef.current.push(id);
    });
  }, [aiComment, store.results]);

  const analysis = useMemo(() => {
    const results = store.results;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = results.length;
    const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
    return { correctCount, totalCount, totalDurationMs };
  }, [store.results]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  const totalDuration = formatDuration(analysis.totalDurationMs);
  const avgDuration =
    analysis.totalCount > 0
      ? formatDuration(
          Math.round(analysis.totalDurationMs / analysis.totalCount),
        )
      : "0초";

  const handleScoreComplete = useCallback(() => {
    scoreTimerIdsRef.current.forEach(clearTimeout);
    scoreTimerIdsRef.current = [];
    [0, 1, 2].forEach((i) => {
      const id = setTimeout(() => {
        setVisibleStats((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
      scoreTimerIdsRef.current.push(id);
    });
  }, []);

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
      <div className="flex gap-8 mt-8">
        <div
          className={`text-center transition-all duration-300 ease-out ${visibleStats[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <div className="text-lg font-bold">
            {analysis.totalCount > 0
              ? Math.round((analysis.correctCount / analysis.totalCount) * 100)
              : 0}
            %
          </div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Target size={11} className="text-text-caption" />
            정답률
          </div>
        </div>
        <div
          className={`text-center transition-all duration-300 ease-out ${visibleStats[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <div className="text-lg font-bold">{totalDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Clock size={11} className="text-text-caption" />총 시간
          </div>
        </div>
        <div
          className={`text-center transition-all duration-300 ease-out ${visibleStats[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <div className="text-lg font-bold">{avgDuration}</div>
          <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
            <Timer size={11} className="text-text-caption" />
            문제당 평균
          </div>
        </div>
      </div>
    </>
  );

  // Step2: AI 분석 + 문제별 결과 통합
  // AI 실패 시 뱃지/텍스트 영역 전체 숨김 — 문제 결과만 바로 표시
  const step2 = (
    <div className="text-left w-full">
      {/* AI 성공 시에만 뱃지 + 텍스트 표시 */}
      {aiComment !== false && (
        <>
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 bg-accent-light text-brand text-base font-semibold px-5 py-2 rounded-full">
              <Sparkles size={16} />
              AI 리포트
            </span>
          </div>

          {/* AI 텍스트 — 로딩: 스켈레톤, 성공: 단어별 fade-in */}
          {aiComment === null ? (
            <div className="space-y-2 animate-pulse mb-6">
              <div className="h-4 bg-border rounded w-full" />
              <div className="h-4 bg-border rounded w-5/6" />
              <div className="h-4 bg-border rounded w-4/6" />
            </div>
          ) : (
            <MarkdownText
                text={aiComment}
                animated
                className="text-body leading-relaxed mb-6"
              />
          )}
        </>
      )}

      {/* 문제별 결과 — AI 애니메이션 완료 후 등장 */}
      <div
        className={`transition-all duration-400 ease-out ${
          resultVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
        }`}
      >
        {resultVisible && (
          <>
            <div className="w-full h-px bg-border mb-3" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-caption">
                문제별 결과
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {store.results.map((r, i) => {
                const q = store.questions.find(
                  (q) => q.questionUuid === r.questionUuid,
                );
                const isOpen = openIndex === i;
                return (
                  <div
                    key={r.questionUuid}
                    className={`bg-surface-card border rounded-[10px] overflow-hidden transition-all duration-350 ease-out ${
                      r.isCorrect ? "border-border" : "border-red-300"
                    } ${visibleCards[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3 text-left"
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                    >
                      <span
                        className={`text-sm font-bold w-5 text-center shrink-0 ${r.isCorrect ? "text-green-600" : "text-red-600"}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{q?.stemPreview}</p>
                        <p className="text-xs text-text-caption mt-0.5">
                          {formatDuration(r.durationMs)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!r.isCorrect && (
                          <span className="text-xs font-medium text-red-400">
                            오답
                          </span>
                        )}
                        {isOpen ? (
                          <ChevronUp size={14} className="text-text-caption" />
                        ) : (
                          <ChevronDown
                            size={14}
                            className="text-text-caption"
                          />
                        )}
                      </div>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-2 border-t border-border space-y-2">
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {q?.stemPreview}
                          </p>
                          <p
                            className={`text-xs font-medium ${r.isCorrect ? "text-green-600" : "text-red-500"}`}
                          >
                            내 답: {r.selectedChoiceBody}
                          </p>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/recommendation/${r.questionUuid}`}
                              state={{
                                returnPath: `/practice/${sessionId}`,
                                initialStep: 1,
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand bg-accent-light rounded-md px-3 py-1.5"
                            >
                              <RotateCcw size={12} /> 다시 풀기
                            </Link>
                            {/* submissionUuid가 있을 때만 신고 버튼 표시 — 제출 실패 건 제외 */}
                            {r.submissionUuid && memberUuid && (
                              <button
                                type="button"
                                className={`btn btn-ghost btn-xs text-error ${
                                  reportedSubmissions.has(r.submissionUuid) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={reportedSubmissions.has(r.submissionUuid)}
                                onClick={() => {
                                  if (!reportedSubmissions.has(r.submissionUuid!)) {
                                    setReportModalTarget({
                                      questionUuid: r.questionUuid,
                                      submissionUuid: r.submissionUuid!,
                                      choiceSetUuid: r.choiceSetUuid,
                                    });
                                  }
                                }}
                              >
                                {reportedSubmissions.has(r.submissionUuid) ? '신고 완료' : '신고'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen max-w-120 mx-auto px-4">
      <StepNavigator
        key={initialStep}
        steps={[step1, step2]}
        initialStep={initialStep}
        lastButtonLabel="카테고리 목록으로"
        onLastStep={() => {
          store.reset();
          navigate("/questions", { replace: true });
        }}
      />

      {/* 신고 접수 토스트 — React 상태로 마운트/언마운트 */}
      {showReportToast && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success text-sm">
            <span>신고를 접수했어요.</span>
          </div>
        </div>
      )}

      {/* 신고 모달 — reportModalTarget이 있을 때만 렌더 */}
      {reportModalTarget && (
        <ReportModal
          questionUuid={reportModalTarget.questionUuid}
          submissionUuid={reportModalTarget.submissionUuid}
          choiceSetUuid={reportModalTarget.choiceSetUuid}
          onClose={() => setReportModalTarget(null)}
          onSuccess={() => {
            // 신고 완료 처리 — 해당 submissionUuid를 완료 목록에 추가
            if (reportModalTarget) {
              setReportedSubmissions((prev) => new Set([...prev, reportModalTarget.submissionUuid]));
            }
            setReportModalTarget(null);
            // 신고 접수 토스트 표시 (2.5초 후 자동 숨김) — ref로 관리하여 언마운트 시 클린업
            setShowReportToast(true);
            if (toastTimerIdRef.current !== null) clearTimeout(toastTimerIdRef.current);
            toastTimerIdRef.current = setTimeout(() => setShowReportToast(false), 2500);
          }}
        />
      )}
    </div>
  );
}
