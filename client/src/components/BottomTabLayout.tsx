import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "홈" },
  { to: "/questions", label: "문제" },
  { to: "/stats", label: "통계" },
  { to: "/settings", label: "설정" },
] as const;

export default function BottomTabLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="btm-nav btm-nav-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="btm-nav-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
