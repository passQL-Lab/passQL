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
 * 설정 페이지 flat 스타일 row (한 줄 horizontal)
 * - label: 왼쪽 식별자 (font-medium, primary 색상)
 * - value: 오른쪽 보조 콘텐츠 (ReactNode — 호출부에서 secondary/caption 색상 지정)
 * - action: value 우측 아이콘 버튼 (선택사항)
 * - 구분선은 부모의 divide-y로 처리
 */
export default function SettingsRow({ label, value, action, onClick }: SettingsRowProps) {
  const baseClass = `flex items-center justify-between px-4 py-3.5 w-full text-left${
    onClick ? " cursor-pointer hover:bg-surface active:bg-surface transition-colors" : ""
  }`;

  const content = (
    <>
      {/* label: 왼쪽 — flex-1로 value를 오른쪽으로 밀어냄 */}
      <span className="text-sm font-medium text-text-primary flex-1">{label}</span>
      {/* value + action: 오른쪽 정렬 */}
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {value}
        {action}
      </div>
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
