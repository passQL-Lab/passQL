import { useRef } from "react";
import { Check, X, Flag } from "lucide-react";
import type { SubmitResult } from "../types/api";
import MarkdownText from "./MarkdownText";

interface PracticeFeedbackBarProps {
  readonly result: SubmitResult;
  readonly onNext: () => void;
  readonly nextLabel: string;
  // 오답 시 보조 버튼 (예: "다시 풀기") — 미전달 시 버튼 미표시
  readonly onSecondary?: () => void;
  readonly secondaryLabel?: string;
  // 신고 기능 — submissionUuid 없으면 버튼 미표시
  readonly onReport?: () => void;
  readonly isReported?: Boolean;
}

export default function PracticeFeedbackBar({
  result,
  onNext,
  nextLabel,
  onSecondary,
  secondaryLabel,
  onReport,
  isReported,
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
              className={`text-base font-bold flex-1 ${isCorrect ? "feedback-bar-heading--correct" : "feedback-bar-heading--error"}`}
            >
              {isCorrect ? "정답이에요!" : "오답이에요"}
            </p>
            {/* 신고 버튼 — onReport 전달 시(submissionUuid 있을 때)만 표시 */}
            {onReport && (
              <button
                type="button"
                aria-label="문제 신고"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  Boolean(isReported)
                    ? "bg-black/10 opacity-40 cursor-not-allowed"
                    : "bg-black/10 hover:bg-black/20"
                }`}
                onClick={Boolean(isReported) ? undefined : onReport}
                disabled={Boolean(isReported)}
              >
                <Flag size={13} className={isCorrect ? "feedback-bar-heading--correct" : "feedback-bar-heading--error"} />
              </button>
            )}
          </div>

          {/* 해설 텍스트 */}
          {result.rationale && (
            <MarkdownText
              text={result.rationale}
              className="text-sm leading-relaxed mb-3 feedback-bar-rationale"
            />
          )}
          {/* 액션 버튼 — 두 버튼 있을 때: 다시 풀기(주요 CTA) / 돌아가기(보조) 순서 */}
          <div className="flex gap-3">
            {onSecondary && secondaryLabel && (
              // 오답 컨텍스트에서 다시 풀기 — 에러 색상으로 구분, 정답이면 인디고 유지
              <button
                type="button"
                className={`flex-1 h-11 rounded-lg font-bold text-base text-white transition-opacity hover:opacity-90 ${
                  isCorrect ? "feedback-bar-next--correct" : "feedback-bar-next--error"
                }`}
                onClick={guard(onSecondary)}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              className={`h-11 rounded-lg font-bold text-base ${
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
