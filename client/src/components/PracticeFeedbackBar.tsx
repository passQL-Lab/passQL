import { Check, X } from "lucide-react";
import type { SubmitResult } from "../types/api";

interface PracticeFeedbackBarProps {
  readonly result: SubmitResult;
  readonly onNext: () => void;
  readonly nextLabel: string;
  // 오답 시 보조 버튼 (예: "다시 풀기") — 미전달 시 버튼 미표시
  readonly onSecondary?: () => void;
  readonly secondaryLabel?: string;
}

export default function PracticeFeedbackBar({
  result,
  onNext,
  nextLabel,
  onSecondary,
  secondaryLabel,
}: PracticeFeedbackBarProps) {
  const isCorrect = result.isCorrect;

  return (
    <>
      {/* 해설 패널 — 하단에서 슬라이드업 (오버레이 없음: EXECUTABLE 모드에서 위 실행 버튼 접근 가능) */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 animate-slide-up rounded-t-2xl"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
        }}
      >
        <div className="mx-auto max-w-120 px-5 pt-3 pb-6">
          {/* 드래그 핸들 */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#D1D5DB" }} />
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

          {/* 액션 버튼 — 오답 + 보조 버튼 있으면 나란히, 아니면 전체 너비 */}
          <div className={`flex gap-3 ${onSecondary ? "" : ""}`}>
            {onSecondary && secondaryLabel && (
              // 보조 버튼: outline 스타일 (다시 풀기 등)
              <button
                type="button"
                className="flex-1 h-12 rounded-xl font-bold text-base border-2"
                style={{
                  borderColor: "var(--color-sem-error)",
                  color: "var(--color-sem-error)",
                  backgroundColor: "transparent",
                }}
                onClick={onSecondary}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              className={`h-12 rounded-xl font-bold text-base text-white ${onSecondary ? "flex-1" : "w-full"}`}
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
      </div>
    </>
  );
}
