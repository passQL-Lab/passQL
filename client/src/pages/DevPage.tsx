import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";

export default function DevPage() {
  const navigate = useNavigate();

  // localStorage 초기화 2단계 확인 상태 (실수 방지)
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  // 1차 클릭: 인라인 경고 노출 + "진짜요?" 버튼 전환 (3초 후 자동 복원)
  // 2차 클릭: localStorage 전체 삭제 + 페이지 reload
  const handleClearStorage = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-surface-card">
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">
          개발자 모드
        </h1>
      </div>

      {/* 콘텐츠 */}
      <div className="py-6 px-4">
        <SettingsSection label="개발자 도구" isFirst>
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="localStorage 초기화"
              value={
                <p className="text-sm text-text-secondary">
                  앱 데이터 전체 삭제 후 재시작
                </p>
              }
              action={
                <button
                  type="button"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    confirmClear
                      ? "bg-sem-error-light border-[#FCA5A5] text-sem-error-text"
                      : "bg-white border-[#FCA5A5] text-sem-error-text hover:bg-sem-error-light"
                  }`}
                  onClick={handleClearStorage}
                >
                  {confirmClear ? "진짜요?" : "초기화"}
                </button>
              }
              isLast
            />
          </div>
          {/* 2차 확인 시 인라인 경고 — 되돌릴 수 없음을 명시 */}
          {confirmClear && (
            <p className="mt-2 px-1 text-xs text-sem-error-text">
              초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로
              시작됩니다. 되돌릴 수 없어요.
            </p>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}
