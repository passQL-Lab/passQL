import { Edit3 } from "lucide-react";
import FeedbackItem from "./FeedbackItem";
import ErrorFallback from "./ErrorFallback";
import { useMyFeedback } from "../hooks/useFeedback";

interface FeedbackListProps {
  /** 오프라인 상태일 때 true — ErrorFallback(network, 재시도 버튼 없음) 표시 */
  readonly disabled?: boolean;
}

/**
 * 건의사항 목록 카드
 * - 로딩: 스켈레톤 2행
 * - 오프라인 / API 에러: ErrorFallback (network / server 타입)
 * - 빈 상태: Edit3 아이콘 + 안내 문구 (카드 유지, 섹션 레이아웃 흔들림 방지)
 * - 정상: FeedbackItem 목록 (useStagger 순차 페이드인)
 */
export default function FeedbackList({ disabled = false }: FeedbackListProps) {
  const { data, isError, isLoading, refetch } = useMyFeedback();

  // 오프라인 또는 에러 — ErrorFallback 표시
  if (disabled || isError) {
    return (
      <ErrorFallback
        errorType={disabled ? "network" : "server"}
        onRetry={disabled ? undefined : () => refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      {isLoading ? (
        // 스켈레톤 로딩
        <div className="animate-pulse">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="px-4 py-3.5 border-b border-[#F3F4F6] last:border-b-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-16 bg-[#F3F4F6] rounded-full" />
                <div className="h-3 w-10 bg-[#F3F4F6] rounded" />
              </div>
              <div className="h-3.5 w-3/4 bg-[#F3F4F6] rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        // 빈 상태 — 카드 숨기지 않고 안내 문구 표시
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <span className="w-11 h-11 rounded-xl bg-[#F3F4F6] text-text-caption flex items-center justify-center mb-2.5">
            <Edit3 size={18} />
          </span>
          <p className="text-[13px] text-text-secondary mb-1">아직 보낸 건의가 없어요</p>
          <p className="text-[11px] text-text-caption">첫 의견을 들려주세요</p>
        </div>
      ) : (
        // 목록 — 각 item은 useStagger로 순차 페이드인
        items.map((item, index) => (
          <FeedbackItem key={item.feedbackUuid} item={item} index={index} />
        ))
      )}
    </div>
  );
}
