import type { FeedbackItem as FeedbackItemType, FeedbackStatus } from "../types/api";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  PENDING: "대기",
  REVIEWED: "확인됨",
  APPLIED: "반영됨",
};

/**
 * ISO 8601 → 버블 내부 표시용 상대 시간
 * 방금 / N분 전 / 오늘 / 어제 / N일 전 / N주 전
 */
function formatBubbleTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "방금";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "오늘";
  if (hours < 48) return "어제";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  return `${weeks}주 전`;
}

/**
 * ISO 8601 → "YYYY-MM-DD" 날짜 키 (날짜 구분선 비교용)
 * FeedbackList에서 import해서 사용한다.
 */
export function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

interface FeedbackItemProps {
  readonly item: FeedbackItemType;
  /** FeedbackList에서 주입하는 stagger 애니메이션 클래스 */
  readonly className?: string;
}

/**
 * 건의사항 단일 버블
 * - 오른쪽 정렬, 하단에 날짜 + 상태 pill
 * - PENDING: 인디고 solid / REVIEWED: 인디고 연한 / APPLIED: 그린 연한
 */
export default function FeedbackItem({ item, className }: FeedbackItemProps) {
  const { status } = item;

  // 버블 배경+텍스트
  const bubbleClass =
    status === "PENDING"
      ? "bg-brand text-white"
      : status === "REVIEWED"
      ? "bg-brand-light border border-[#C7D2FE] text-text-primary"
      : "bg-sem-success-light border border-[#BBF7D0] text-text-primary";

  // 상태 pill
  const pillClass =
    status === "PENDING"
      ? "bg-white/20 text-white"
      : status === "REVIEWED"
      ? "bg-brand text-white"
      : "bg-sem-success-text text-white";

  // 시간 색상
  const timeClass = status === "PENDING" ? "text-white/60" : "text-text-caption";

  return (
    <div className={`flex justify-end${className ? ` ${className}` : ""}`}>
      <div
        className={`max-w-[82%] px-3.5 py-3 rounded-[16px_16px_3px_16px] text-sm leading-relaxed ${bubbleClass}`}
      >
        {/* 본문 */}
        <p className="mb-2 break-words">{item.content}</p>
        {/* 메타: 시간 + 상태 pill */}
        <div className="flex items-center justify-end gap-1.5">
          <span className={`text-[10px] ${timeClass}`}>
            {formatBubbleTime(item.createdAt)}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-px rounded-full ${pillClass}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
