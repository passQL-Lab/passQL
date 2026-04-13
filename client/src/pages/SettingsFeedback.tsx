import { WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import SubpageLayout from "../components/SubpageLayout";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

/**
 * 건의사항 서브페이지
 * - AppLayout 밖 독립 라우트 (/settings/feedback)
 * - 탭바 없는 몰입형 화면 — SubpageLayout 사용
 */
export default function SettingsFeedback() {
  const isOnline = useOnline();

  return (
    <SubpageLayout title="건의사항" contentClassName="space-y-3">
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
          <WifiOff size={14} className="text-sem-warning-text shrink-0" />
          오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
        </div>
      )}
      <FeedbackForm disabled={!isOnline} />
      <FeedbackList disabled={!isOnline} />
    </SubpageLayout>
  );
}
