const MOCK_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const MOCK_NICKNAME = "용감한 판다";

export default function Settings() {
  const truncatedUuid = MOCK_UUID.slice(0, 20) + "...";

  return (
    <div className="py-6">
      {/* Settings card */}
      <div className="card-base p-0">
        {/* 디바이스 ID */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">디바이스 ID</p>
            <p className="font-mono text-[13px] text-text-primary mt-1">{truncatedUuid}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            title="복사"
          >
            📋
          </button>
        </div>

        {/* 닉네임 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">닉네임</p>
            <p className="text-body font-bold mt-1">{MOCK_NICKNAME}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            title="재생성"
          >
            ↻
          </button>
        </div>

        {/* 버전 */}
        <div className="px-5 py-4">
          <p className="text-secondary text-sm">버전</p>
          <p className="text-caption text-sm mt-1">1.0.0-MVP</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 space-y-1">
        <p className="text-[13px]" style={{ color: "#D1D5DB" }}>SQLD Master</p>
        <p className="text-xs" style={{ color: "#D1D5DB" }}>Powered by Vite + React</p>
      </div>
    </div>
  );
}
