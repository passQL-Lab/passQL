import { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { usePracticeStore } from "../stores/practiceStore";
import QuestionDetail from "./QuestionDetail";

export default function PracticeSet() {
  const { sessionId, index } = useParams<{ sessionId: string; index: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();
  const currentIndex = Number(index ?? 0);
  const question = store.questions[currentIndex];

  useEffect(() => {
    if (question) {
      store.startTimer();
    }
  }, [currentIndex, question]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (currentIndex >= store.questions.length) {
    return <Navigate to={`/practice/${sessionId}/result`} replace />;
  }

  const handleSubmitComplete = (isCorrect: boolean, selectedChoiceKey: string) => {
    store.recordResult(question.questionUuid, isCorrect, selectedChoiceKey);
    store.nextQuestion();
    navigate(`/practice/${sessionId}/${currentIndex + 1}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-secondary">
            {currentIndex + 1} / {store.questions.length}
          </span>
          <span className="badge-topic">{store.topicName}</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / store.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <QuestionDetail
          key={question.questionUuid}
          practiceMode
          onPracticeSubmit={handleSubmitComplete}
        />
      </div>
    </div>
  );
}
