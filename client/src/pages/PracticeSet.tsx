import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, Navigate, useBlocker } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitAnswer } from "../api/questions";
import { getRandomMessage } from "../constants/microcopy";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import LoadingOverlay from "../components/LoadingOverlay";
import type { ChoiceItem, SubmitResult } from "../types/api";

function WaitingForQuestion({ topicName }: { readonly topicName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-10 h-10 border-3 border-accent-light border-t-brand rounded-full animate-spin" />
      <p className="text-body text-center">{getRandomMessage(topicName)}</p>
      <p className="text-xs text-text-caption">잠시만 기다려주세요</p>
    </div>
  );
}

export default function PracticeSet() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const storeSessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const topicName = usePracticeStore((s) => s.topicName);
  const submitAndAdvance = usePracticeStore((s) => s.submitAndAdvance);

  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  // 답안 제출 API 호출 중 화면 조작 차단
  const [submitting, setSubmitting] = useState(false);
  // Home 버튼 클릭 시 이탈 확인 모달 — blocker와 독립적으로 제어
  const [exitModalOpen, setExitModalOpen] = useState(false);
  // 연타 방지 — React state는 async 클로저에서 stale하므로 ref로 동기 플래그 관리
  const isProcessingRef = useRef(false);
  // exitConfirmed=true 시 blocker를 우회하여 홈으로 이동 — 이중 확인 방지
  const [exitConfirmed, setExitConfirmed] = useState(false);

  const totalQuestions = questions.length;
  const displayIndex = feedback ? currentIndex - 1 : currentIndex;
  const displayQuestion = questions[displayIndex];

  // 마지막 문제 완료 여부 — 결과 페이지 이동 조건이자 이탈 차단 해제 기준
  const shouldNavigateToResult = !feedback && currentIndex >= totalQuestions;

  // 마지막 문제 완료 전까지 이탈 차단 — 중간 이탈 시 세션 기록 유실 방지
  // exitConfirmed=true이면 차단 해제 → useEffect에서 navigate("/") 호출
  // useBlocker는 훅이므로 조건부 return 이전에 호출해야 함
  // submitting 중에는 이탈 차단 해제 — 채점 API 진행 중 모달 충돌 방지
  const blocker = useBlocker(!shouldNavigateToResult && !exitConfirmed && !submitting);

  const handleSelect = useCallback(
    async (
      selectedChoiceKey: string,
      choiceSetId: string,
      choices: readonly ChoiceItem[],
    ) => {
      if (!displayQuestion) return;
      // 연타로 인한 중복 제출 방지 — ref는 동기적으로 즉시 반영됨
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      // 결과 화면에서 선택지 키(A/B/C/D) 대신 실제 선택지 텍스트를 보여주기 위해 body 추출
      const selectedChoiceBody = choices.find((c) => c.key === selectedChoiceKey)?.body ?? selectedChoiceKey;
      setSubmitting(true);
      try {
        const result = await submitAnswer(
          displayQuestion.questionUuid,
          choiceSetId,
          selectedChoiceKey,
          // sessionId는 startSession 시 crypto.randomUUID()로 생성 — AI 코멘트 세션 집계에 사용
          storeSessionId ?? crypto.randomUUID(),
        );
        setFeedback(result);
        // submissionUuid: 백엔드가 응답에 포함하면 전달, 없으면 undefined → 결과 화면에서 신고 버튼 미표시
        submitAndAdvance(
          displayQuestion.questionUuid,
          result.isCorrect,
          selectedChoiceKey,
          selectedChoiceBody,
          result.submissionUuid,
          choiceSetId,
        );
        // 마지막 문제 제출 완료 시에만 무효화 — 도중 이탈은 갱신하지 않기로 결정
        if (currentIndex + 1 >= totalQuestions) {
          queryClient.invalidateQueries({ queryKey: ["heatmap"] });
          queryClient.invalidateQueries({ queryKey: ["progress"] });
        }
      } catch {
        const fallback: SubmitResult = {
          isCorrect: false,
          correctKey: "?",
          rationale: "",
          selectedResult: null,
          correctResult: null,
          selectedSql: null,
          correctSql: null,
        };
        setFeedback(fallback);
        // 제출 실패 시 submissionUuid 없음 → 신고 버튼 미표시
        submitAndAdvance(
          displayQuestion.questionUuid,
          false,
          selectedChoiceKey,
          selectedChoiceBody,
          undefined,
          choiceSetId,
        );
      } finally {
        isProcessingRef.current = false;
        setSubmitting(false);
      }
    },
    [displayQuestion, submitAndAdvance, currentIndex, totalQuestions, queryClient],
  );

  const handleNext = useCallback(() => {
    // 피드백바 닫힘 → 다음 문제 렌더 직후 초이스카드가 즉시 눌리는 탭-스루 방지
    // isProcessingRef를 잠근 뒤 렌더 완료 시점(~300ms)까지 새 제출 차단
    isProcessingRef.current = true;
    setFeedback(null);
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 300);
  }, []);

  // useEffect는 훅 규칙상 조건부 return 이전에 위치해야 함
  useEffect(() => {
    if (shouldNavigateToResult) {
      navigate(`/practice/${sessionId}/result`, { replace: true });
    }
  }, [shouldNavigateToResult, navigate, sessionId]);

  // exitConfirmed 시 blocker가 비활성화된 후 홈으로 이동 — 이중 차단 방지
  useEffect(() => {
    if (exitConfirmed) {
      navigate("/");
    }
  }, [exitConfirmed, navigate]);

  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (shouldNavigateToResult) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen max-w-120 mx-auto w-full">
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 items-center mb-2">
          <div className="justify-self-start">
            <button
              type="button"
              aria-label="풀이 나가기"
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
              onClick={() => setExitModalOpen(true)}
            >
              <ArrowLeft size={18} className="text-text-secondary" />
            </button>
          </div>
          <span className="text-sm font-semibold text-text-secondary text-center">
            {displayIndex + 1} / {totalQuestions}
          </span>
          <div className="justify-self-end">
            <span className="badge-topic">{topicName}</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${((displayIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {displayQuestion ? (
        /* 피드백바 높이(~200px)만큼 bottom padding — 마지막 초이스카드가 가려지지 않게 */
        <div className={`flex-1 overflow-y-auto px-4 transition-[padding] duration-300 ${feedback ? "pb-52" : "pb-4"}`}>
          {/* 제출 후 showExecution=true — ChoiceCard 안에 SQL 실행 버튼 표시 */}
          <QuestionDetail
            key={displayQuestion.questionUuid}
            questionUuid={displayQuestion.questionUuid}
            practiceMode
            practiceSubmitLabel="확인"
            onPracticeSubmit={handleSelect}
            showExecution={!!feedback}
          />
        </div>
      ) : (
        <WaitingForQuestion topicName={topicName ?? ""} />
      )}

      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          onNext={handleNext}
          nextLabel={feedback?.isCorrect ? "계속하기" : "확인"}
        />
      )}

      {/* 채점 중 오버레이 — 제출 API 응답 전 화면 조작 차단 */}
      {submitting && (
        <LoadingOverlay
          topicName={topicName ?? ""}
          staticMessage="채점 중이에요"
          subMessage="잠시만 기다려주세요"
        />
      )}

      {/* 이탈 방지 확인 모달 — Home 버튼(exitModalOpen) 또는 브라우저 뒤로가기(blocker) 대응 */}
      <ConfirmModal
        isOpen={blocker.state === "blocked" || exitModalOpen}
        title="풀이를 그만할까요?"
        description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
        cancelLabel="계속 풀기"
        confirmLabel="나가기"
        onCancel={() => {
          blocker.reset?.();
          setExitModalOpen(false);
        }}
        onConfirm={() => {
          // blocker가 활성화된 경우(브라우저 뒤로가기 등) → proceed로 원래 이동 허용
          // exitModalOpen인 경우(Home 버튼) → exitConfirmed=true로 blocker 먼저 해제 후 navigate
          if (blocker.state === "blocked") {
            blocker.proceed?.();
          } else {
            setExitConfirmed(true);
          }
          setExitModalOpen(false);
        }}
      />
    </div>
  );
}
