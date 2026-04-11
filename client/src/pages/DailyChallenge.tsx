import { useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useTodayQuestion } from "../hooks/useHome";
import { submitAnswer } from "../api/questions";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import type { ChoiceItem, SubmitResult } from "../types/api";

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { data: today, isLoading } = useTodayQuestion();
  const [feedback, setFeedback] = useState<SubmitResult | null>(null);

  // 정답 시에만 submitAnswer 호출 — 오답은 로컬 피드백만 표시해 alreadySolvedToday 유지
  const handlePracticeSubmit = useCallback(
    async (selectedChoiceKey: string, choiceSetId: string, choices: readonly ChoiceItem[]) => {
      if (!today?.question) return;

      const selectedChoice = choices.find((c) => c.key === selectedChoiceKey);
      const correctChoice = choices.find((c) => c.isCorrect);

      if (selectedChoice?.isCorrect) {
        // 정답: 백엔드에 제출 → 완료 처리 (alreadySolvedToday=true)
        try {
          const result = await submitAnswer(today.question.questionUuid, choiceSetId, selectedChoiceKey);
          setFeedback(result);
        } catch {
          navigate("/", { replace: true });
        }
      } else {
        // 오답: submitAnswer 호출 안 함 → 미완료 상태 유지 → 다시 풀기 가능
        const localResult: SubmitResult = {
          isCorrect: false,
          correctKey: correctChoice?.key ?? "",
          rationale: correctChoice?.rationale ?? selectedChoice?.rationale ?? "",
          selectedResult: null,
          correctResult: null,
          selectedSql: null,
          correctSql: null,
        };
        setFeedback(localResult);
      }
    },
    [today?.question, navigate],
  );

  // 이미 오늘 풀었으면 홈으로 리다이렉트
  if (!isLoading && today?.alreadySolvedToday) {
    return <Navigate to="/" replace />;
  }

  // 오늘의 문제 없음
  if (!isLoading && !today?.question) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
        <p className="text-body text-text-secondary">오늘의 문제가 아직 없어요</p>
        <button
          type="button"
          className="btn-primary px-6"
          onClick={() => navigate("/", { replace: true })}
        >
          홈으로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-120 mx-auto w-full">
      {/* PracticeSet과 동일한 헤더 구조 */}
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
            오늘의 문제
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

      {/* 피드백 표시 중 선택 불가 */}
      <div className={`flex-1 overflow-y-auto px-4 ${feedback ? "pointer-events-none opacity-60" : ""}`}>
        <QuestionDetail
          key={today?.question?.questionUuid}
          questionUuid={today?.question?.questionUuid}
          practiceMode
          practiceSubmitLabel="제출하기"
          onPracticeSubmit={handlePracticeSubmit}
        />
      </div>

      {/* 제출 후 인라인 피드백 — 정답: 홈으로, 오답: 다시 풀기 */}
      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          nextLabel={feedback.isCorrect ? "홈으로 가기" : "다시 풀기"}
          onNext={
            feedback.isCorrect
              ? () => navigate("/", { replace: true })
              : () => setFeedback(null)
          }
        />
      )}
    </div>
  );
}
