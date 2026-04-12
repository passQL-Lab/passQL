import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BarChart3, Settings, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "../assets/logo/logo.png";
import MobileHeader from "./MobileHeader";
import TeamModal from "./TeamModal";

const NAV_ITEMS: readonly {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
}[] = [
  { to: "/", label: "홈", icon: Home },
  { to: "/questions", label: "AI문제", icon: Sparkles },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/settings", label: "설정", icon: Settings },
] as const;

function SidebarNav() {
  return (
    <aside className="hidden lg:flex flex-col w-55 border-r border-border bg-surface-card h-screen sticky top-0 py-6 px-3 gap-1">
      <div className="px-4 mb-8">
        <img src={logo} alt="passQL" className="h-6 w-auto" />
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `nav-sidebar-item ${isActive ? "nav-sidebar-item--active" : ""}`
          }
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div className="mt-auto px-4 pt-4 border-t border-border">
        <img src={logo} alt="passQL" className="h-4 w-auto opacity-40 mb-1" />
        <p className="text-[10px] text-text-caption">© 2026 passQL</p>
      </div>
    </aside>
  );
}

function BottomTabNav() {
  return (
    // dock: daisyUI 하단 탭 컴포넌트 (fixed bottom-0, flex, items-center 내장)
    <nav className="dock lg:hidden h-14 bg-base-100 border-t border-base-300 z-30">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            // active 클래스: daisyUI dock 활성 상태 (primary 색상 적용)
            isActive ? "active text-primary" : "text-base-content/40"
          }
        >
          <item.icon size={20} />
          {/* dock-label: 아이콘 아래 텍스트 레이블 */}
          <span className="dock-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  // 탭 전환 시 Outlet을 리마운트해 스태거 애니메이션을 재실행한다.
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <SidebarNav />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <MobileHeader onTeamClick={() => setTeamModalOpen(true)} />
        <main className="flex-1 lg:py-8 pb-16 lg:pb-8">
          <div className="mx-auto max-w-180 px-4 lg:px-0">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
      <BottomTabNav />

      {teamModalOpen && (
        <TeamModal onClose={() => setTeamModalOpen(false)} />
      )}
    </div>
  );
}
