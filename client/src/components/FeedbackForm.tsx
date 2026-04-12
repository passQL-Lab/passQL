import { useState } from "react";
import { Edit3, Send, AlertTriangle } from "lucide-react";
import { useSubmitFeedback } from "../hooks/useFeedback";

const MAX_LENGTH = 500;

interface FeedbackFormProps {
  /** 오프라인 상태일 때 true — textarea + 버튼 비활성 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 입력 카드
 * - 헤더: Edit3 아이콘 + "의견 보내기" + 보조 문구
 * - textarea: focus 시 카드 보더 → 인디고 (focus-within CSS)
 * - 푸터: 글자수 카운터 + 보내기 버튼 (1~500자 입력 시 활성)
 * - 에러: Soft fill — 배경색 only, 왼쪽 굵은 보더 없음
 */
export default function FeedbackForm({ disabled = false }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const mutation = useSubmitFeedback();

  const isValid = content.length >= 1 && content.length <= MAX_LENGTH;
  const isDisabled = disabled || !isValid || mutation.isPending;

  const handleSubmit = () => {
    if (!isValid || mutation.isPending) return;
    mutation.mutate(content, {
      onSuccess: () => setContent(""),
    });
  };

  const handleRetry = () => {
    if (!isValid || mutation.isPending) return;
    mutation.reset();
    mutation.mutate(content, {
      onSuccess: () => setContent(""),
    });
  };

  return (
    <div className="border border-border rounded-2xl bg-surface-card focus-within:border-brand transition-colors px-[18px] py-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
          <Edit3 size={14} />
        </span>
        <span className="text-[13px] font-semibold text-text-primary">의견 보내기</span>
        <span className="text-[11px] text-text-caption ml-auto">백엔드 팀이 직접 확인해요</span>
      </div>

      {/* Textarea — 보더 없음, transparent bg, focus outline 없음 */}
      <textarea
        className="w-full min-h-16 resize-none border-none outline-none bg-transparent text-sm text-text-primary leading-relaxed placeholder:text-text-caption disabled:cursor-not-allowed"
        placeholder="앱에 바라는 점을 자유롭게 적어주세요"
        value={content}
        onChange={(e) => {
          if (e.target.value.length <= MAX_LENGTH) setContent(e.target.value);
        }}
        disabled={disabled || mutation.isPending}
        rows={3}
      />

      {/* 푸터: 카운터 + 보내기 버튼 */}
      <div className="flex items-center justify-between border-t border-surface-code pt-2.5 mt-2.5">
        <span className="text-[11px] text-text-caption tabular-nums">
          {/* 1자 이상이면 카운터 숫자만 인디고 강조 */}
          <span className={content.length > 0 ? "text-brand font-semibold" : ""}>
            {content.length}
          </span>
          {" / "}
          {MAX_LENGTH}
        </span>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isDisabled
              ? "bg-border text-text-caption cursor-not-allowed"
              : "bg-brand text-white"
          }`}
          disabled={isDisabled}
          onClick={handleSubmit}
        >
          보내기
          <Send size={12} />
        </button>
      </div>

      {/* 제출 실패 인라인 에러 — Soft fill */}
      {mutation.isError && (
        <div className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 bg-sem-error-light rounded-lg text-xs text-sem-error-text">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="flex-1">전송에 실패했어요</span>
          <button
            type="button"
            className="bg-white border border-[#FCA5A5] text-sem-error-text px-2.5 py-1 rounded-md text-[11px] font-bold"
            onClick={handleRetry}
          >
            재시도
          </button>
        </div>
      )}
    </div>
  );
}
