import { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { useSubmitFeedback } from "../hooks/useFeedback";

const MAX_LENGTH = 500;

interface FeedbackFormProps {
  /** 오프라인 상태일 때 true — textarea + 버튼 비활성 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 하단 고정 입력 영역
 * - textarea wrap: 포커스 시 보더 인디고
 * - 1자 이상 입력 시 보내기 버튼 활성
 * - 전송 실패 시 인라인 에러 배너 + 재시도 버튼
 */
export default function FeedbackForm({ disabled = false }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const mutation = useSubmitFeedback();

  const isValid = content.length >= 1 && content.length <= MAX_LENGTH;
  const isDisabled = disabled || !isValid || mutation.isPending;

  const handleSubmit = () => {
    if (!isValid || mutation.isPending) return;
    mutation.mutate(content, { onSuccess: () => setContent("") });
  };

  const handleRetry = () => {
    if (!isValid || mutation.isPending) return;
    mutation.reset();
    mutation.mutate(content, { onSuccess: () => setContent("") });
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface-card px-3 pt-2.5 pb-4">
      {/* textarea wrap */}
      <div
        className={`bg-surface border rounded-xl px-3 pt-2.5 pb-2 transition-colors ${
          mutation.isPending ? "border-border" : "border-border focus-within:border-brand"
        }`}
      >
        <textarea
          className="w-full min-h-[52px] resize-none border-none outline-none bg-transparent text-[11.5px] text-text-primary leading-relaxed placeholder:text-text-caption disabled:cursor-not-allowed"
          placeholder="앱에 바라는 점을 자유롭게 적어주세요"
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) setContent(e.target.value);
          }}
          disabled={disabled || mutation.isPending}
          rows={2}
        />
        {/* 하단 푸터: 글자수 + 보내기 버튼 */}
        <div className="flex items-center justify-between border-t border-surface-code pt-2 mt-1">
          <span className="text-[9.5px] text-text-caption tabular-nums">
            <span className={content.length > 0 ? "text-brand font-semibold" : ""}>
              {content.length}
            </span>
            {" / "}{MAX_LENGTH}
          </span>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              isDisabled
                ? "bg-border text-text-caption cursor-not-allowed"
                : "bg-brand text-white"
            }`}
            disabled={isDisabled}
            onClick={handleSubmit}
          >
            보내기
            <Send size={11} />
          </button>
        </div>
      </div>

      {/* 전송 실패 인라인 에러 */}
      {mutation.isError && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-sem-error-light border border-[#FCA5A5] rounded-lg text-[10px] text-sem-error-text">
          <AlertTriangle size={12} className="shrink-0" />
          <span className="flex-1">전송에 실패했어요</span>
          <button
            type="button"
            className="bg-white border border-[#FCA5A5] text-sem-error-text px-2 py-1 rounded-md text-[9.5px] font-bold"
            onClick={handleRetry}
          >
            재시도
          </button>
        </div>
      )}
    </div>
  );
}
