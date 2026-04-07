import { NavLink, Outlet } from "react-router-dom";
import { Home, FileText, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: readonly { readonly to: string; readonly label: string; readonly icon: LucideIcon }[] = [
  { to: "/", label: "홈", icon: Home },
  { to: "/questions", label: "문제", icon: FileText },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/settings", label: "설정", icon: Settings },
] as const;

function SidebarNav() {
  return (
    <aside className="hidden lg:flex flex-col w-[220px] border-r border-border bg-surface-card h-screen sticky top-0 py-6 px-3 gap-1">
      <div className="text-h2 px-4 mb-8 text-brand">passQL</div>
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
    </aside>
  );
}

function BottomTabNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-surface-card border-t border-border flex items-center justify-around z-30">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `nav-tab ${isActive ? "nav-tab--active" : "nav-tab--inactive"}`
          }
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <SidebarNav />
      <main className="flex-1 lg:py-8 pb-16 lg:pb-8">
        <div className="mx-auto max-w-[720px] px-4 lg:px-0">
          <Outlet />
        </div>
      </main>
      <BottomTabNav />
    </div>
  );
}
