import type { ReactNode } from "react";

interface SettingsRowProps {
  readonly label: string;
  readonly value: ReactNode;
  /** 우측 아이콘 버튼 영역 (Copy, RefreshCw 등) */
  readonly action?: ReactNode;
  /** true이면 하단 border 없음 (카드의 마지막 row) */
  readonly isLast?: boolean;
  /** 클릭 핸들러 - 제공되면 row 전체가 인터랙티브 */
  readonly onClick?: () => void;
}

/**
 * 설정 카드 내 단일 row
 * - label: 회색 보조 텍스트
 * - value: 메인 콘텐츠 (ReactNode)
 * - action: 우측 아이콘 버튼 (선택사항)
 * - onClick: 클릭 핸들러 - 제공되면 row 전체가 인터랙티브 스타일 적용
 */
export default function SettingsRow({ label, value, action, isLast, onClick }: SettingsRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-4 ${
        isLast ? "" : "border-b border-border"
      } ${onClick ? "cursor-pointer hover:bg-surface active:bg-surface-code transition-colors" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-text-secondary text-sm">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </div>
  );
}
