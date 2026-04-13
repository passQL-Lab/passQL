import type { ReactNode } from "react";

interface SettingsRowProps {
  readonly label: string;
  readonly value: ReactNode;
  /** 우측 아이콘 버튼 영역 (Copy, RefreshCw 등) */
  readonly action?: ReactNode;
  /** 클릭 핸들러 - 제공되면 row 전체가 인터랙티브 */
  readonly onClick?: () => void;
}

/**
 * 설정 페이지 flat 스타일 row
 * - label: 회색 보조 텍스트
 * - value: 메인 콘텐츠 (ReactNode)
 * - action: 우측 아이콘 버튼 (선택사항)
 * - onClick: 클릭 핸들러 — 제공되면 <button>으로 렌더링 (키보드/스크린리더 접근성)
 * - 구분선은 부모의 divide-y로 처리 (isLast 불필요)
 */
export default function SettingsRow({ label, value, action, onClick }: SettingsRowProps) {
  const baseClass = `flex items-center justify-between px-5 py-4 w-full text-left${
    onClick ? " cursor-pointer hover:bg-surface active:bg-surface transition-colors" : ""
  }`;

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-text-secondary text-sm">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </>
  );

  // onClick이 있으면 <button>으로 렌더링 — 키보드 포커스 및 Enter/Space 동작 보장
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
