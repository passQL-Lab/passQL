import type { ReactNode } from "react";

interface SettingsSectionProps {
  readonly label: string;
  /** 의미 있는 카운트가 있을 때만 인디고 pill 표시 (undefined / 0 → 숨김) */
  readonly count?: number;
  readonly children: ReactNode;
  /** true이면 mt-0 (페이지 첫 섹션), false/undefined이면 mt-6 */
  readonly isFirst?: boolean;
  readonly className?: string;
}

/**
 * 설정 페이지 섹션 헤더 래퍼
 * - 좌측: text-text-secondary 라벨
 * - 우측: count가 있으면 인디고 pill (홈 화면 패턴과 동일)
 */
export default function SettingsSection({
  label,
  count,
  children,
  isFirst,
  className,
}: SettingsSectionProps) {
  return (
    <div className={`${isFirst ? "" : "mt-6"} ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-2 px-0.5">
        <span className="text-text-secondary text-sm font-medium">{label}</span>
        {!!count && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand-light text-brand rounded-full text-[11px] font-bold">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
