import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import AiExplanationSheet from "../components/AiExplanationSheet";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
}

export default function AnswerFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FeedbackState | null;

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const diffMutation = useMutation({
    mutationFn: diffExplain,
    onSuccess: (result) => setAiText(result.text),
  });

  const handleAskAi = () => {
    if (!state) return;
    setAiSheetOpen(true);
    setAiText("");
    diffMutation.mutate({
      question_id: 0,
      selected_key: state.selectedKey,
    });
  };

  if (!state) {
    navigate("/questions", { replace: true });
    return null;
  }

  const { isCorrect, correctKey, rationale, selectedKey, selectedSql, correctSql } = state;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-180 w-full px-4 pb-24">
        {isCorrect ? (
          <>
            <div className="text-center pt-12 pb-8">
              <div
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#DCFCE7" }}
              >
                <Check size={36} style={{ color: "var(--color-sem-success-text)" }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-success-text)" }}>
                정답입니다!
              </h1>
              <p className="text-secondary mt-2">정확히 맞혔어요! 다음 문제도 도전해보세요</p>
            </div>
            <div className="card-base">
              <p className="text-secondary text-sm mb-3">해설</p>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                  style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
                >
                  {correctKey}
                </span>
              </div>
              {correctSql && (
                <pre
                  className="rounded-lg p-4 text-sm font-mono leading-relaxed mb-4"
                  style={{
                    backgroundColor: "var(--color-sem-success-light)",
                    borderLeft: "4px solid var(--color-sem-success)",
                  }}
                >
                  <code>{correctSql}</code>
                </pre>
              )}
              <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
                {rationale}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center pt-12 pb-8">
              <div
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                <X size={36} style={{ color: "var(--color-sem-error-text)" }} />
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-error-text)" }}>
                오답입니다
              </h1>
              <p className="text-secondary mt-2">다음엔 맞출 수 있어요. 해설을 확인해보세요</p>
            </div>
            <div className="card-base space-y-0">
              {selectedSql && (
                <div
                  className="rounded-lg p-4 mb-4"
                  style={{
                    backgroundColor: "var(--color-sem-error-light)",
                    borderLeft: "4px solid var(--color-sem-error)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">내가 선택한 답</span>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                      style={{ backgroundColor: "#FEE2E2", color: "var(--color-sem-error-text)" }}
                    >
                      {selectedKey}
                    </span>
                  </div>
                  <pre className="text-sm font-mono leading-relaxed">
                    <code>{selectedSql}</code>
                  </pre>
                </div>
              )}
              {correctSql && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: "var(--color-sem-success-light)",
                    borderLeft: "4px solid var(--color-sem-success)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">정답</span>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
                      style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
                    >
                      {correctKey}
                    </span>
                  </div>
                  <pre className="text-sm font-mono leading-relaxed">
                    <code>{correctSql}</code>
                  </pre>
                </div>
              )}
              <p className="text-body leading-relaxed mt-4" style={{ color: "#374151" }}>
                {rationale}
              </p>
              <button className="btn-primary w-full mt-4" type="button" onClick={handleAskAi}>
                AI에게 자세히 물어보기
              </button>
            </div>
          </>
        )}
      </div>

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={diffMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      <div
        className="fixed bottom-0 inset-x-0 p-4 z-20"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
        }}
      >
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className="w-full h-[52px] rounded-lg text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => navigate("/questions")}
          >
            다음 문제
          </button>
        </div>
      </div>
    </div>
  );
}
