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
    <div
      className="fixed bottom-0 inset-x-0 z-30 animate-slide-up"
      style={{
        backgroundColor: isCorrect
          ? "var(--color-sem-success-light)"
          : "var(--color-sem-error-light)",
      }}
    >
      <div className="mx-auto max-w-120 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          {isCorrect ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#DCFCE7" }}
            >
              <Check size={18} style={{ color: "var(--color-sem-success-text)" }} />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <X size={18} style={{ color: "var(--color-sem-error-text)" }} />
            </div>
          )}
          <div>
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
        </div>

        {result.rationale && (
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {result.rationale}
          </p>
        )}

        <button
          type="button"
          className="w-full h-12 rounded-xl text-white font-bold text-base"
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
  );
}
