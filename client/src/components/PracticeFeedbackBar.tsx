import { useRef } from "react";
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
  // 버튼 언마운트 전 이중 클릭 방지 — 한 번 눌리면 플래그 세팅, 부모 언마운트 시 자동 초기화
  const hasActedRef = useRef(false);
  const guard = (fn: () => void) => () => {
    if (hasActedRef.current) return;
    hasActedRef.current = true;
    fn();
  };

  return (
    <>
      {/* 해설 패널 — 하단에서 슬라이드업 (오버레이 없음: EXECUTABLE 모드에서 위 실행 버튼 접근 가능) */}
      <div
        className={`fixed bottom-0 inset-x-0 z-30 animate-slide-up rounded-t-2xl ${isCorrect ? "feedback-bar--correct" : "feedback-bar--error"}`}
      >
        <div className="mx-auto max-w-120 px-5 pt-5 pb-6">
          {/* 정답/오답 헤더 */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? "feedback-bar-icon--correct" : "feedback-bar-icon--error"}`}
            >
              {isCorrect ? (
                <Check size={15} className="feedback-bar-check" />
              ) : (
                <X size={15} className="feedback-bar-x" />
              )}
            </div>
            <p
              className={`text-base font-bold ${isCorrect ? "feedback-bar-heading--correct" : "feedback-bar-heading--error"}`}
            >
              {isCorrect ? "정답이에요!" : "오답이에요"}
            </p>
          </div>

          {/* 해설 텍스트 */}
          {result.rationale && (
            <p
              className="text-sm leading-relaxed mb-5 feedback-bar-rationale"
            >
              {result.rationale}
            </p>
          )}

          {/* 액션 버튼 — 두 버튼 있을 때: 다시 풀기(주요 CTA) / 돌아가기(보조) 순서 */}
          <div className="flex gap-3">
            {onSecondary && secondaryLabel && (
              // 다시 풀기: brand 인디고 solid — 권장 행동임을 강조
              <button
                type="button"
                className="flex-1 h-12 rounded-xl font-bold text-base text-white bg-brand"
                onClick={guard(onSecondary)}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              className={`h-12 rounded-xl font-bold text-base ${
                onSecondary
                  // 보조 버튼: outline 스타일 — 탈출 경로임을 시각적으로 약화
                  ? "flex-1 feedback-bar-next-outline"
                  : `w-full text-white ${isCorrect ? "feedback-bar-next--correct" : "feedback-bar-next--error"}`
              }`}
              onClick={guard(onNext)}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
