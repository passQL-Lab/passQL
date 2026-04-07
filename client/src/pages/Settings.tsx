import { Copy, RefreshCw } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";

export default function Settings() {
  const uuid = useMemberStore((s) => s.uuid);
  const truncatedUuid = uuid.slice(0, 20) + "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
  };

  return (
    <div className="py-6">
      <div className="card-base p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">디바이스 ID</p>
            <p className="font-mono text-[13px] text-text-primary mt-1">{truncatedUuid}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            title="복사"
            onClick={handleCopy}
          >
            <Copy size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">닉네임</p>
            <p className="text-body font-bold mt-1">{uuid.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption opacity-50 cursor-not-allowed"
            title="재생성 (미구현)"
            disabled
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-secondary text-sm">버전</p>
          <p className="text-caption text-sm mt-1">1.0.0-MVP</p>
        </div>
      </div>

      <div className="text-center mt-8 space-y-1">
        <p className="text-[13px]" style={{ color: "#D1D5DB" }}>passQL</p>
        <p className="text-xs" style={{ color: "#D1D5DB" }}>Powered by Vite + React</p>
      </div>
    </div>
  );
}
