import { Check, X } from "lucide-react";
import type { SubmitResult } from "../types/api";

interface PracticeFeedbackBarProps {
  readonly result: SubmitResult;
  readonly onNext: () => void;
  readonly nextLabel: string;
}

export default function PracticeFeedbackBar({
  result,
  onNext,
  nextLabel,
}: PracticeFeedbackBarProps) {
  const isCorrect = result.isCorrect;

  return (
    <>
      {/* 딤 오버레이 — 해설 패널에 시선 집중 */}
      <div className="fixed inset-0 z-20" style={{ backgroundColor: "rgba(17, 24, 39, 0.25)" }} />

      {/* 해설 패널 — 하단에서 슬라이드업 */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 animate-slide-up rounded-t-2xl"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
          borderTop: `3px solid ${isCorrect ? "var(--color-sem-success)" : "var(--color-sem-error)"}`,
        }}
      >
        <div className="mx-auto max-w-120 px-5 pt-5 pb-6">
          {/* 정답/오답 헤더 */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: isCorrect ? "#DCFCE7" : "#FEE2E2",
              }}
            >
              {isCorrect ? (
                <Check size={15} style={{ color: "var(--color-sem-success-text)" }} />
              ) : (
                <X size={15} style={{ color: "var(--color-sem-error-text)" }} />
              )}
            </div>
            <p
              className="text-base font-bold"
              style={{
                color: isCorrect
                  ? "var(--color-sem-success-text)"
                  : "var(--color-sem-error-text)",
              }}
            >
              {isCorrect ? "정답이에요!" : "오답이에요"}
            </p>
          </div>

          {/* 해설 텍스트 */}
          {result.rationale && (
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "var(--color-text-body)" }}
            >
              {result.rationale}
            </p>
          )}

          {/* 액션 버튼 */}
          <button
            type="button"
            className="w-full h-12 rounded-xl font-bold text-base text-white"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={onNext}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </>
  );
}
