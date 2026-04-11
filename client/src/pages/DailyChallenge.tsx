import { useNavigate, Navigate } from "react-router-dom";
import { useTodayQuestion } from "../hooks/useHome";
import QuestionDetail from "./QuestionDetail";
import type { SubmitResult } from "../types/api";

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { data: today, isLoading } = useTodayQuestion();

  // 이미 오늘 풀었으면 홈으로 리다이렉트
  if (!isLoading && today?.alreadySolvedToday) {
    return <Navigate to="/" replace />;
  }

  // 오늘의 문제 없음
  if (!isLoading && !today?.question) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
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

  // 제출 성공 시 결과 화면으로 이동 — isDailyChallenge 플래그 전달
  const handleSubmitSuccess = (result: SubmitResult, questionUuid: string) => {
    navigate(`/questions/${questionUuid}/result`, {
      state: { ...result, isDailyChallenge: true },
    });
  };

  return (
    <QuestionDetail
      questionUuid={today?.question?.questionUuid}
      onSubmitSuccess={handleSubmitSuccess}
    />
  );
}
