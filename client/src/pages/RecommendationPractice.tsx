import { useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation, useBlocker } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { submitAnswer } from "../api/questions";
import { usePracticeStore } from "../stores/practiceStore";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import LoadingOverlay from "../components/LoadingOverlay";
import type { ChoiceItem, SubmitResult } from "../types/api";

export default function RecommendationPractice() {
  const { questionUuid } = useParams<{ questionUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { markCorrect, setReturnStep } = usePracticeStore();

  // PracticeResult 등 이전 화면으로 복귀할 경로 — 없으면 홈으로
  const locationState = location.state as { returnPath?: string; initialStep?: number } | null;
  const returnPath = locationState?.returnPath ?? "/";
  // PracticeResult에서 진입한 경우 — 타이틀 "틀린 문제", 복귀 시 step3 유지
  const isPracticeReview = returnPath !== "/";
  const returnInitialStep = locationState?.initialStep ?? 0;

  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  // 제출 API 호출 중 화면 조작 차단
  const [submitting, setSubmitting] = useState(false);
  // 연타 방지 — React state는 async 클로저에서 stale하므로 ref로 동기 플래그 관리
  const isProcessingRef = useRef(false);

  // 제출 완료 전까지 이탈 차단 — submitting 중에는 해제 (catch navigate 허용)
  const blocker = useBlocker(feedback === null && !submitting);

  const handlePracticeSubmit = useCallback(
    async (selectedChoiceKey: string, choiceSetId: string, _choices: readonly ChoiceItem[]) => {
      if (!questionUuid) return;
      // 연타로 인한 중복 제출 방지
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setSubmitting(true);
      try {
        const result = await submitAnswer(questionUuid, choiceSetId, selectedChoiceKey);
        // 추천 문제 캐시 무효화 — 홈 복귀 시 새 목록 반영
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
        // PracticeResult에서 진입한 경우 정답 시 store 결과 갱신
        if (result.isCorrect && isPracticeReview) {
          markCorrect(questionUuid);
        }
        setFeedback(result);
      } catch {
        navigate("/", { replace: true });
      } finally {
        isProcessingRef.current = false;
        setSubmitting(false);
      }
    },
    [questionUuid, navigate, queryClient, isPracticeReview, markCorrect, setReturnStep],
  );

  if (!questionUuid) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen max-w-120 mx-auto w-full">
      {/* DailyChallenge와 동일한 헤더 구조 */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 items-center mb-2">
          <div className="justify-self-start">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
              onClick={() => navigate("/")}
            >
              <Home size={18} className="text-text-secondary" />
            </button>
          </div>
          <span className="text-sm font-semibold text-text-secondary text-center">
            {isPracticeReview ? "틀린 문제" : "추천 문제"}
          </span>
          <div />
        </div>
        {/* 제출 전: 비어있음 / 제출 후: 완료 표시 */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: feedback ? "100%" : "0%" }}
          />
        </div>
      </div>

      {/* 피드백바 높이만큼 bottom padding — 마지막 선택지 카드가 가려지지 않게 */}
      <div className={`flex-1 overflow-y-auto px-4 transition-[padding] duration-300 ${feedback ? "pb-52" : "pb-4"}`}>
        {/* 제출 후 showExecution=true — ChoiceCard 안에 SQL 실행 버튼 표시 */}
        <QuestionDetail
          key={questionUuid}
          questionUuid={questionUuid}
          practiceMode
          practiceSubmitLabel="확인"
          onPracticeSubmit={handlePracticeSubmit}
          showExecution={!!feedback}
        />
      </div>

      {/* 제출 후 인라인 피드백 — returnPath 있으면 "돌아가기", 없으면 "홈으로 가기" */}
      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          nextLabel={isPracticeReview ? "돌아가기" : "홈으로 가기"}
          onNext={() => {
            // location.state 대신 store를 통해 returnStep 전달 — React Router v7 state 전달 불안정 이슈 우회
            if (isPracticeReview) setReturnStep(returnInitialStep);
            navigate(returnPath, { replace: true });
          }}
          {...(!feedback.isCorrect && {
            secondaryLabel: "다시 풀기",
            // 피드백 닫힘 후 초이스카드 즉시 눌림 방지 — 300ms 쿨다운
            onSecondary: () => {
              isProcessingRef.current = true;
              setFeedback(null);
              setTimeout(() => { isProcessingRef.current = false; }, 300);
            },
          })}
        />
      )}

      {/* 채점 중 오버레이 — 제출 API 응답 전 화면 조작 차단 */}
      {submitting && (
        <LoadingOverlay
          topicName="추천 문제"
          staticMessage="채점 중이에요"
          subMessage="잠시만 기다려주세요"
        />
      )}

      {/* 이탈 방지 확인 모달 */}
      <ConfirmModal
        isOpen={blocker.state === "blocked"}
        title="풀이를 그만할까요?"
        description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
        cancelLabel="계속 풀기"
        confirmLabel="나가기"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}
