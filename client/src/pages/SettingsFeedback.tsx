import { useNavigate } from "react-router-dom";
import { ArrowLeft, WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

/**
 * 건의사항 서브페이지
 * - AppLayout 밖 독립 라우트 (/settings/feedback)
 * - 탭바 없는 몰입형 화면 — DevPage 패턴 동일
 */
export default function SettingsFeedback() {
  const navigate = useNavigate();
  const isOnline = useOnline();

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
        <h1 className="text-base font-semibold text-text-primary">건의사항</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
        {/* 오프라인 배너 */}
        {!isOnline && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <WifiOff size={14} className="text-sem-warning-text shrink-0" />
            오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
          </div>
        )}
        <FeedbackForm disabled={!isOnline} />
        <FeedbackList disabled={!isOnline} />
      </div>
    </div>
  );
}
