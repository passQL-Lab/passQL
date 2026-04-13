import { Users } from "lucide-react";
import logo from "../assets/logo/logo.png";

interface MobileHeaderProps {
  onTeamClick: () => void;
}

export default function MobileHeader({ onTeamClick }: MobileHeaderProps) {
  return (
    // 모바일 전용 sticky 헤더 — 데스크톱은 사이드바 로고로 대체
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 bg-surface-card border-b border-border h-14">
      <img src={logo} alt="passQL" className="h-6 w-auto" />

      {/* 팀 아이콘 — 모달 오픈은 부모(AppLayout)가 담당 */}
      <button
        onClick={onTeamClick}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-light text-brand hover:bg-brand-medium/20 transition-colors"
        aria-label="팀 정보 보기"
      >
        <Users size={16} />
      </button>
    </header>
  );
}
