import { useState, useRef, useEffect } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";
import logo from "../assets/logo/logo.png";
import { useRegenerateNickname } from "../hooks/useMember";
import { useStagger } from "../hooks/useStagger";

export default function Settings() {
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = uuid.slice(0, 20) + "...";
  const regenerateMutation = useRegenerateNickname();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 섹션별 순차 페이드인 딜레이 생성
  const stagger = useStagger();
  const s0 = stagger(0); // 제목
  const s1 = stagger(1); // 설정 카드
  const s2 = stagger(2); // 하단 로고 + 카피라이트

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
      {/* CSS variable(--stagger-delay) 주입 — Tailwind로 표현 불가하여 style prop 예외 허용 */}
      {/* ① 제목 */}
      <section className={s0.className} style={s0.style}>
        <h1 className="text-h1 mb-6">설정</h1>
      </section>

      {/* ② 설정 카드 */}
      <section className={`card-base p-0 ${s1.className}`} style={s1.style}>
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
          <p className="text-caption text-sm mt-1">{__APP_VERSION__}</p>
        </div>
      </section>

      {/* ③ 하단 로고 + 카피라이트 */}
      <section className={`text-center mt-8 space-y-2 ${s2.className}`} style={s2.style}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
      </section>
    </div>
  );
}
