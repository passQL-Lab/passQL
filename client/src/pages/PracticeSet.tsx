import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Navigate, useBlocker } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitAnswer } from "../api/questions";
import { getRandomMessage } from "../constants/microcopy";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import ChoiceReview from "../components/ChoiceReview";
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

  const storeSessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const topicName = usePracticeStore((s) => s.topicName);
  const submitAndAdvance = usePracticeStore((s) => s.submitAndAdvance);

  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  // Home 버튼 클릭 시 이탈 확인 모달 — blocker와 독립적으로 제어
  const [exitModalOpen, setExitModalOpen] = useState(false);
  // EXECUTABLE 문제 오답노트용 상태
  const [reviewChoices, setReviewChoices] = useState<
    readonly ChoiceItem[] | null
  >(null);
  const [reviewSelectedKey, setReviewSelectedKey] = useState<string | null>(
    null,
  );

  const totalQuestions = questions.length;
  const displayIndex = feedback ? currentIndex - 1 : currentIndex;
  const displayQuestion = questions[displayIndex];
  const isLast = displayIndex >= totalQuestions - 1;

  // 마지막 문제 완료 여부 — 결과 페이지 이동 조건이자 이탈 차단 해제 기준
  const shouldNavigateToResult = !feedback && currentIndex >= totalQuestions;

  // 마지막 문제 완료 전까지 이탈 차단 — 중간 이탈 시 세션 기록 유실 방지
  // useBlocker는 훅이므로 조건부 return 이전에 호출해야 함
  const blocker = useBlocker(!shouldNavigateToResult);

  const handleSelect = useCallback(
    async (
      selectedChoiceKey: string,
      choiceSetId: string,
      choices: readonly ChoiceItem[],
    ) => {
      if (!displayQuestion) return;
      // EXECUTABLE 문제면 오답노트 데이터 저장
      if (choices[0]?.kind === "SQL") {
        setReviewChoices(choices);
        setReviewSelectedKey(selectedChoiceKey);
      }
      try {
        const result = await submitAnswer(
          displayQuestion.questionUuid,
          choiceSetId,
          selectedChoiceKey,
        );
        setFeedback(result);
        submitAndAdvance(
          displayQuestion.questionUuid,
          result.isCorrect,
          selectedChoiceKey,
        );
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
        submitAndAdvance(
          displayQuestion.questionUuid,
          false,
          selectedChoiceKey,
        );
      }
    },
    [displayQuestion, submitAndAdvance],
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
    setReviewChoices(null);
    setReviewSelectedKey(null);
  }, []);

  // useEffect는 훅 규칙상 조건부 return 이전에 위치해야 함
  useEffect(() => {
    if (shouldNavigateToResult) {
      navigate(`/practice/${sessionId}/result`, { replace: true });
    }
  }, [shouldNavigateToResult, navigate, sessionId]);

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
        <div className="flex-1 overflow-y-auto px-4">
          {/* 풀이 중: 선택 가능 / 피드백 후: 흐리게 비활성화 */}
          <div className={feedback ? "pointer-events-none opacity-60" : ""}>
            <QuestionDetail
              key={displayQuestion.questionUuid}
              questionUuid={displayQuestion.questionUuid}
              practiceMode
              practiceSubmitLabel={isLast ? "결과 보기" : "확인하기"}
              onPracticeSubmit={handleSelect}
            />
          </div>
          {/* EXECUTABLE 문제: 피드백 후 오답노트 SQL 실행 비교 */}
          {feedback && reviewChoices && (
            <ChoiceReview
              choices={reviewChoices}
              questionUuid={displayQuestion.questionUuid}
              selectedKey={reviewSelectedKey ?? undefined}
            />
          )}
        </div>
      ) : (
        <WaitingForQuestion topicName={topicName ?? ""} />
      )}

      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          onNext={handleNext}
          nextLabel={currentIndex >= totalQuestions ? "결과 보기" : "다음 문제"}
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
          // exitModalOpen인 경우(Home 버튼) → 직접 홈으로 이동
          if (blocker.state === "blocked") {
            blocker.proceed?.();
          } else {
            navigate("/");
          }
          setExitModalOpen(false);
        }}
      />
    </div>
  );
}
