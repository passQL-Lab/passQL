import { useParams, useNavigate, Navigate } from "react-router-dom";
import { usePracticeStore } from "../stores/practiceStore";
import QuestionDetail from "./QuestionDetail";

export default function PracticeSet() {
  const { sessionId, index } = useParams<{ sessionId: string; index: string }>();
  const navigate = useNavigate();

  const storeSessionId = usePracticeStore((s) => s.sessionId);
  const questions = usePracticeStore((s) => s.questions);
  const topicName = usePracticeStore((s) => s.topicName);
  const submitAndAdvance = usePracticeStore((s) => s.submitAndAdvance);

  const currentIndex = Number(index ?? 0);
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  if (!storeSessionId || storeSessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (currentIndex >= questions.length) {
    return <Navigate to={`/practice/${sessionId}/result`} replace />;
  }

  const handleSelect = (selectedChoiceKey: string) => {
    submitAndAdvance(question.questionUuid, true, selectedChoiceKey);
    if (isLast) {
      navigate(`/practice/${sessionId}/result`, { replace: true });
    } else {
      navigate(`/practice/${sessionId}/${currentIndex + 1}`, { replace: true });
    }
  };

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
