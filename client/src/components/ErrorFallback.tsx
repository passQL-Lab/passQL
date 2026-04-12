import { RefreshCw, WifiOff, ServerCrash, ShieldAlert, AlertCircle } from "lucide-react";

/** 에러 성격에 따라 아이콘·제목·설명을 다르게 안내하기 위한 타입 */
export type ErrorType = "network" | "server" | "auth" | "generic";

interface ErrorFallbackProps {
  readonly message?: string;
  readonly errorType?: ErrorType;
  readonly onRetry?: () => void;
}

/** 에러 타입별 아이콘·제목·설명 매핑 */
const ERROR_META: Record<ErrorType, {
  icon: React.ReactNode;
  title: string;
  description: string;
}> = {
  network: {
    icon: <WifiOff size={28} className="text-text-caption" />,
    title: "인터넷 연결을 확인해주세요",
    description: "네트워크가 불안정합니다. 연결 상태를 확인한 뒤 다시 시도해보세요.",
  },
  server: {
    icon: <ServerCrash size={28} className="text-text-caption" />,
    title: "서버에 문제가 생겼어요",
    description: "일시적인 서버 오류입니다. 잠시 후 다시 시도하면 해결될 수 있어요.",
  },
  auth: {
    icon: <ShieldAlert size={28} className="text-text-caption" />,
    title: "인증이 필요해요",
    description: "세션이 만료됐거나 권한이 없습니다. 페이지를 새로고침해 주세요.",
  },
  generic: {
    icon: <AlertCircle size={28} className="text-text-caption" />,
    title: "데이터를 불러올 수 없어요",
    description: "잠시 후 다시 시도해보세요. 문제가 반복되면 페이지를 새로고침해 주세요.",
  },
};

export default function ErrorFallback({
  message,
  errorType = "generic",
  onRetry,
}: ErrorFallbackProps) {
  const meta = ERROR_META[errorType];

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center gap-4 py-10 px-6 my-6">
      {/* 에러 아이콘 — 회색 원형 배경으로 severity 없이 차분하게 */}
      <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
        {meta.icon}
      </div>

      <div className="space-y-1.5">
        <p className="text-base font-semibold text-text-primary">{meta.title}</p>
        {/* 커스텀 메시지가 있으면 우선 표시, 없으면 타입별 기본 설명 */}
        <p className="text-sm text-text-secondary leading-relaxed">
          {message ?? meta.description}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          className="btn-compact inline-flex items-center gap-2 mt-2"
          onClick={onRetry}
        >
          <RefreshCw size={15} />
          다시 시도하기
        </button>
      )}
    </div>
  );
}
