import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Home } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitAnswer } from "../api/questions";
import { getRandomMessage } from "../constants/microcopy";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import type { SubmitResult } from "../types/api";

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

  const totalQuestions = questions.length;
  const displayIndex = feedback ? currentIndex - 1 : currentIndex;
  const displayQuestion = questions[displayIndex];
  const isLast = displayIndex >= totalQuestions - 1;

  const handleSelect = useCallback(
    async (selectedChoiceKey: string) => {
      if (!displayQuestion) return;
      try {
        const result = await submitAnswer(displayQuestion.questionUuid, selectedChoiceKey);
        setFeedback(result);
        submitAndAdvance(displayQuestion.questionUuid, result.isCorrect, selectedChoiceKey);
      } catch {
        const fallback: SubmitResult = { isCorrect: false, correctKey: "?", rationale: "" };
        setFeedback(fallback);
        submitAndAdvance(displayQuestion.questionUuid, false, selectedChoiceKey);
      }
    },
    [displayQuestion, submitAndAdvance],
  );

  const handleNext = useCallback(() => {
    setFeedback(null);
  }, []);

  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  const shouldNavigateToResult = !feedback && currentIndex >= totalQuestions;
  useEffect(() => {
    if (shouldNavigateToResult) {
      navigate(`/practice/${sessionId}/result`, { replace: true });
    }
  }, [shouldNavigateToResult, navigate, sessionId]);

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
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-colors"
              onClick={() => navigate("/")}
            >
              <Home size={18} className="text-text-secondary" />
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
        <div className={`flex-1 overflow-y-auto px-4 ${feedback ? "pointer-events-none opacity-60" : ""}`}>
          <QuestionDetail
            key={displayQuestion.questionUuid}
            questionUuid={displayQuestion.questionUuid}
            practiceMode
            practiceSubmitLabel={isLast ? "결과 보기" : "다음 문제"}
            onPracticeSubmit={handleSelect}
          />
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
    </div>
  );
}
