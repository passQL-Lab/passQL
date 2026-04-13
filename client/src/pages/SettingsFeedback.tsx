import { WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import SubpageLayout from "../components/SubpageLayout";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

/**
 * 건의사항 서브페이지 — 채팅 스타일 레이아웃
 * - SubpageLayout fullHeight=true: h-screen flex-col, 헤더 고정
 * - FeedbackList: flex-1 overflow-y-auto (버블 목록 스크롤)
 * - FeedbackForm: shrink-0 하단 고정 입력 영역
 */
export default function SettingsFeedback() {
  const isOnline = useOnline();

  return (
    <SubpageLayout title="건의사항" fullHeight>
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 bg-sem-warning-light border-b border-[#FDE68A] text-[10.5px] text-[#92400E]">
          <WifiOff size={13} className="text-sem-warning-text shrink-0" />
          오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
        </div>
      )}
      {/* 채팅 버블 목록 (스크롤) */}
      <FeedbackList disabled={!isOnline} />
      {/* 하단 고정 입력 */}
      <FeedbackForm disabled={!isOnline} />
    </SubpageLayout>
  );
}
