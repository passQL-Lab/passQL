import { useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { usePracticeStore } from "../stores/practiceStore";
import QuestionDetail from "./QuestionDetail";

export default function PracticeSet() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const storeSessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const currentIndex = usePracticeStore((s) => s.currentIndex);
  const topicName = usePracticeStore((s) => s.topicName);
  const submitAndAdvance = usePracticeStore((s) => s.submitAndAdvance);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = useCallback((selectedChoiceKey: string) => {
    if (!question) return;
    submitAndAdvance(question.questionUuid, true, selectedChoiceKey);
  }, [question, submitAndAdvance]);

  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (currentIndex >= questions.length) {
    navigate(`/practice/${sessionId}/result`, { replace: true });
    return null;
  }

  return (
    <div className="flex flex-col h-screen max-w-[480px] mx-auto w-full">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-secondary">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="badge-topic">{topicName}</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <QuestionDetail
          key={question.questionUuid}
          questionUuid={question.questionUuid}
          practiceMode
          practiceSubmitLabel={isLast ? "결과 보기" : "다음 문제"}
          onPracticeSubmit={handleSelect}
        />
      </div>
    </div>
  );
}
