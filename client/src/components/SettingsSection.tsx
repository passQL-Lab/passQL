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
 * 설정 페이지 섹션 헤더 래퍼 (flat 스타일)
 * - iOS/토스 패턴: 소문자 회색 라벨만, 섹션 간 여백으로 위계 표현
 * - 기존 카드 elevation 없이 텍스트 라벨 + 구분선으로만 구분
 */
export default function SettingsSection({
  label,
  children,
  isFirst,
  className,
}: SettingsSectionProps) {
  return (
    <div className={[isFirst ? "" : "mt-6", className ?? ""].filter(Boolean).join(" ")}>
      {/* 소문자 회색 라벨 — iOS 설정 앱 스타일 */}
      {/* 섹션 라벨 — 아래 여백 8px로 그룹 소유감 확보 */}
      <p className="text-sm text-text-caption px-1 mb-2">{label}</p>
      {children}
    </div>
  );
}
