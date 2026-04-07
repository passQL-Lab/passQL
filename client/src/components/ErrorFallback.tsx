import { RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  readonly message?: string;
  readonly onRetry?: () => void;
}

export default function ErrorFallback({
  message = "데이터를 불러올 수 없습니다",
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="py-12 text-center">
      <p className="text-secondary mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="btn-compact inline-flex items-center gap-2"
          onClick={onRetry}
        >
          <RefreshCw size={14} />
          다시 시도
        </button>
      )}
    </div>
  );
}
