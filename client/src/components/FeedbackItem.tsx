import { useStagger } from "../hooks/useStagger";
import type { FeedbackItem as FeedbackItemType, FeedbackStatus } from "../types/api";

// 상태별 pill 디자인 설정 (기존 디자인 토큰 사용)
const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING:  { label: "대기",   bg: "bg-sem-warning-light", text: "text-sem-warning-text", dot: "bg-[#D97706]" },
  REVIEWED: { label: "확인됨", bg: "bg-brand-light",       text: "text-brand",            dot: "bg-brand"    },
  APPLIED:  { label: "반영됨", bg: "bg-sem-success-light", text: "text-sem-success-text", dot: "bg-[#16A34A]" },
};

/** ISO 8601 문자열 → "방금 / N분 전 / N시간 전 / N일 전 / N주 전" */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

interface FeedbackItemProps {
  readonly item: FeedbackItemType;
  /** 목록 내 위치 인덱스 — useStagger 순차 페이드인에 사용 */
  readonly index: number;
}

/**
 * 건의사항 단일 row
 * - 상단: 상태 pill + 상대 시간
 * - 하단: 본문 텍스트
 * - useStagger로 목록 진입 시 순차 페이드인
 */
export default function FeedbackItem({ item, index }: FeedbackItemProps) {
  const stagger = useStagger();
  const s = stagger(index);
  const config = STATUS_CONFIG[item.status];

  return (
    <div
      className={`px-4 py-3.5 border-b border-[#F3F4F6] last:border-b-0 hover:bg-surface transition-colors ${s.className}`}
    >
      {/* 상단: 상태 pill + 시간 */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
          {config.label}
        </span>
        <span className="text-[11px] text-text-caption">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* 하단: 본문 */}
      <p className="text-[13.5px] text-text-primary leading-snug">{item.content}</p>
    </div>
  );
}
