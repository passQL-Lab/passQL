import { useState } from "react";
import { Terminal, Activity, Database, X, Bug } from "lucide-react";
import { useDevContext } from "./DevProvider";
import { ApiLogPanel } from "./panels/ApiLogPanel";
import { AiDebugPanel } from "./panels/AiDebugPanel";
import { StorePanel } from "./panels/StorePanel";

type PanelType = "api" | "ai" | "store";

// Speed Dial 항목 목록 — 타입, 아이콘, 레이블 고정
const PANELS: { readonly type: PanelType; readonly icon: React.ReactNode; readonly label: string }[] = [
  { type: "api", icon: <Activity size={16} />, label: "API 로그" },
  { type: "ai", icon: <Terminal size={16} />, label: "AI 디버거" },
  { type: "store", icon: <Database size={16} />, label: "스토어" },
];

export function DevFab() {
  const { devEnabled } = useDevContext();
  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);

  // 개발자 모드 비활성화 시 렌더링 스킵
  if (!devEnabled) return null;

  const handleDialItem = (type: PanelType) => {
    setActivePanel(type);
    setOpen(false);
  };

  return (
    <>
      {/* Speed Dial FAB — 오른쪽 하단 고정, 탭바(56px) 위에 위치 */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
        {open &&
          PANELS.map(({ type, icon, label }) => (
            <div key={type} className="flex items-center gap-2">
              {/* 패널 이름 툴팁 레이블 */}
              <span className="text-xs bg-[#1F2937] text-white px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                {label}
              </span>
              <button
                type="button"
                className="btn btn-circle btn-sm bg-surface-card border border-border text-text-primary hover:bg-brand hover:text-white hover:border-brand shadow-md transition-colors"
                onClick={() => handleDialItem(type)}
              >
                {icon}
              </button>
            </div>
          ))}

        {/* 메인 FAB — 열림 상태에 따라 색상 전환 */}
        <button
          type="button"
          className={`btn btn-circle shadow-lg transition-colors ${
            open
              ? "bg-[#1F2937] text-white border-[#1F2937]"
              : "bg-brand text-white border-brand"
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="개발자 HUD"
        >
          {open ? <X size={20} /> : <Bug size={20} />}
        </button>
      </div>

      {/* 패널 슬라이드업 오버레이 — 하단에서 50vh 높이로 표시 */}
      {activePanel && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-lg rounded-t-2xl h-[50vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">
              {PANELS.find((p) => p.type === activePanel)?.label}
            </span>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
            >
              <X size={16} />
            </button>
          </div>
          {/* 패널 헤더(52px)를 제외한 나머지 높이에서 스크롤 */}
          <div className="h-[calc(50vh-52px)] overflow-hidden">
            {activePanel === "api" && <ApiLogPanel />}
            {activePanel === "ai" && <AiDebugPanel />}
            {activePanel === "store" && <StorePanel />}
          </div>
        </div>
      )}
    </>
  );
}
