import { Fragment } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackItem, { toDateKey } from "./FeedbackItem";
import ErrorFallback from "./ErrorFallback";
import { useMyFeedback } from "../hooks/useFeedback";
import { useStagger } from "../hooks/useStagger";

interface FeedbackListProps {
  /** 오프라인 상태일 때 true — ErrorFallback(network) 표시 */
  readonly disabled?: boolean;
}

/** ISO 8601 → 날짜 구분선 표시 텍스트 */
function getDateLabel(isoString: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(isoString).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${Math.floor(diffDays / 7)}주 전`;
}

/** 날짜 구분선 */
function DateDivider({ date }: { readonly date: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[9.5px] text-text-caption whitespace-nowrap">
        {getDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/** 로딩 중 버블 스켈레톤 */
function BubbleSkeleton({ widthClass }: { readonly widthClass: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={`h-14 rounded-[16px_16px_3px_16px] bg-surface-code animate-pulse ${widthClass}`}
      />
    </div>
  );
}

/**
 * 건의사항 채팅 버블 목록
 * - API 반환값(최신순)을 뒤집어 오래된 것이 위, 최신이 아래로 표시
 * - 날짜가 바뀌는 지점에 DateDivider 삽입
 * - 로딩: 스켈레톤 2개 / 빈 상태: EmptyState / 에러: ErrorFallback
 */
export default function FeedbackList({ disabled = false }: FeedbackListProps) {
  const { data, isError, isLoading, refetch } = useMyFeedback();
  const stagger = useStagger();

  // 오프라인 또는 조회 에러
  if (disabled || isError) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <ErrorFallback
          errorType={disabled ? "network" : "server"}
          onRetry={disabled ? undefined : () => refetch()}
        />
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-end gap-2.5 px-3.5 py-4">
        <BubbleSkeleton widthClass="w-[65%]" />
        <BubbleSkeleton widthClass="w-[75%]" />
      </div>
    );
  }

  // 빈 상태
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-2 text-center">
        <div className="w-11 h-11 rounded-xl bg-surface-code flex items-center justify-center mb-1">
          <MessageSquare size={20} className="text-text-caption" />
        </div>
        <p className="text-[12px] font-semibold text-text-secondary">
          아직 보낸 건의가 없어요
        </p>
        <p className="text-[11px] text-text-caption leading-relaxed">
          궁금한 점이나 원하는 기능을
          <br />
          자유롭게 남겨주세요
        </p>
      </div>
    );
  }

  // API는 최신순(desc) 반환 → 화면은 오래된 것 위, 최신 것 아래
  const sorted = [...items].reverse();

  return (
    <div className="flex-1 flex flex-col gap-2.5 px-3.5 py-4 overflow-y-auto">
      {sorted.map((item, idx) => {
        const showDivider =
          idx === 0 ||
          toDateKey(item.createdAt) !== toDateKey(sorted[idx - 1].createdAt);
        return (
          <Fragment key={item.feedbackUuid}>
            {showDivider && <DateDivider date={item.createdAt} />}
            <FeedbackItem item={item} className={stagger(idx).className} />
          </Fragment>
        );
      })}
    </div>
  );
}
