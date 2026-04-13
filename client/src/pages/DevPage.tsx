import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function DevPage() {
  const navigate = useNavigate();

  // localStorage 초기화 2단계 확인 상태 (실수 방지)
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // toast 메시지 — null이면 미표시
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // 1차 클릭: 경고 toast + "진짜요?" 버튼 전환 (3초 후 자동 복원)
  // 2차 클릭: localStorage 전체 삭제 + 페이지 reload
  const handleClearStorage = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      showToast("초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로 시작됩니다. 되돌릴 수 없어요.");
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    localStorage.clear();
    window.location.reload();
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
        <h1 className="text-base font-semibold text-text-primary">개발자 모드</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          {/* localStorage 초기화 row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Trash2 size={14} className="text-sem-error shrink-0" />
                <p className="text-sm font-medium text-text-primary">localStorage 초기화</p>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                앱 데이터 전체 삭제 후 재시작
              </p>
            </div>
            <button
              type="button"
              className={`ml-4 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                confirmClear
                  ? "bg-sem-error-light border-sem-error text-sem-error-text"
                  : "bg-surface-card border-sem-error text-sem-error-text hover:bg-sem-error-light"
              }`}
              onClick={handleClearStorage}
            >
              {confirmClear ? "진짜요?" : "초기화"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast 알림 — 하단 중앙 고정 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-sm">
          <div className="bg-toast-bg text-white text-sm px-4 py-3 rounded-lg shadow-lg text-center">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
