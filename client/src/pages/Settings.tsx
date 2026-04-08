import { useState, useRef, useEffect } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";
import { useRegenerateNickname } from "../hooks/useMember";

export default function Settings() {
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = uuid.slice(0, 20) + "...";
  const regenerateMutation = useRegenerateNickname();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  return (
    <div className="py-6">
      <h1 className="text-h1 mb-6">설정</h1>
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
            {copied ? <Check size={16} className="text-sem-success" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">닉네임</p>
            <p className="text-body font-bold mt-1">{nickname || uuid.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              regenerateMutation.isPending
                ? "text-text-caption animate-spin"
                : "text-text-caption hover:text-brand"
            }`}
            title="닉네임 재생성"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
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
