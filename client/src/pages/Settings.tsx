import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, RefreshCw, WifiOff, ChevronRight } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";
import logo from "../assets/logo/logo.png";
import { useRegenerateNickname } from "../hooks/useMember";
import { useStagger } from "../hooks/useStagger";
import { useOnline } from "../hooks/useOnline";
import { useMyFeedback } from "../hooks/useFeedback";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

export default function Settings() {
  const navigate = useNavigate();
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = `${uuid.slice(0, 20)}...`;
  const regenerateMutation = useRegenerateNickname();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = useOnline();
  // 건의사항 섹션 헤더 카운트 pill용 — FeedbackList 내부와 캐시 공유 (dedup)
  const { data: feedbackData } = useMyFeedback();
  const feedbackCount =
    feedbackData && feedbackData.items.length > 0
      ? feedbackData.items.length
      : undefined;

  // 개발자 모드 Easter Egg — sessionStorage 복원으로 페이지 재진입 시에도 row 유지
  const [devUnlocked, setDevUnlocked] = useState(() => sessionStorage.getItem("devUnlocked") === "1");
  const clickCountRef = useRef(0);
  // 2초 안에 5번 클릭하지 않으면 카운터 리셋
  const clickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // toast 메시지 — null이면 미표시
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 섹션별 순차 페이드인 (50ms 간격)
  const stagger = useStagger();
  const s0 = stagger(0); // h1 "설정"
  const s1 = stagger(1); // 계정 섹션
  const s2 = stagger(2); // 건의사항 입력 카드
  const s3 = stagger(3); // 건의사항 목록 카드
  const s4 = stagger(4); // 앱 정보 섹션
  const s5 = stagger(5); // 로고 + 카피라이트

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // 버전 row 클릭 — 2초 안에 5번 연속 클릭 시 개발자 모드 잠금 해제
  const handleVersionClick = () => {
    if (devUnlocked) return;
    clickCountRef.current += 1;
    const count = clickCountRef.current;

    // 마지막 클릭으로부터 2초 경과 시 카운터 리셋
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    clickResetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    if (count === 3) showToast("개발자 모드까지 2번 남았습니다");
    else if (count === 4) showToast("개발자 모드까지 1번 남았습니다");
    else if (count >= 5) {
      // 카운터·타이머 정리 후 잠금 해제
      clickCountRef.current = 0;
      if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
      // sessionStorage에 저장 — route guard에서 접근 허용 여부 확인
      sessionStorage.setItem("devUnlocked", "1");
      setDevUnlocked(true);
      showToast("개발자 모드가 활성화되었습니다");
    }
  };

  return (
    <div className="py-6">
      {/* ① h1 */}
      <section className={s0.className}>
        <h1 className="text-h1 mb-6">설정</h1>
      </section>

      {/* ② 계정 섹션 */}
      <section className={s1.className}>
        <SettingsSection label="계정" isFirst>
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="닉네임"
              value={
                <p className="text-body font-bold">{nickname || uuid.slice(0, 8)}</p>
              }
              action={
                <button
                  type="button"
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    regenerateMutation.isPending
                      ? "text-text-caption animate-spin"
                      : "text-text-caption hover:text-brand"
                  }`}
                  title="닉네임 재생성"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  <RefreshCw size={16} />
                </button>
              }
            />
            <SettingsRow
              label="디바이스 ID"
              value={
                <p className="font-mono text-[13px] text-text-primary">{truncatedUuid}</p>
              }
              action={
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
                  title="복사"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check size={16} className="text-sem-success" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              }
              isLast
            />
          </div>
        </SettingsSection>
      </section>

      {/* ③ 건의사항 섹션 헤더 + 입력 카드 */}
      <section className={`mt-6 ${s2.className}`}>
        <SettingsSection label="건의사항" count={feedbackCount}>
          {/* 오프라인 배너 */}
          {/* border-[#FDE68A]: 토큰 없음 — sem-warning-light(#FEF3C7)의 border 버전 없음 */}
          {/* text-[#92400E]: 토큰 없음 — sem-warning-text(#D97706)와 다른 딥 앰버 색상 */}
          {!isOnline && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E] mb-2.5">
              <WifiOff size={14} className="text-sem-warning-text shrink-0" />
              오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
            </div>
          )}
          <FeedbackForm disabled={!isOnline} />
        </SettingsSection>
      </section>

      {/* ④ 건의사항 목록 카드 */}
      <section className={`mt-3 ${s3.className}`}>
        <FeedbackList disabled={!isOnline} />
      </section>

      {/* ⑤ 앱 정보 섹션 */}
      <section className={`mt-6 ${s4.className}`}>
        <SettingsSection label="앱 정보">
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="버전"
              value={<p className="text-caption">{__APP_VERSION__}</p>}
              onClick={devUnlocked ? undefined : handleVersionClick}
              isLast={!devUnlocked}
            />
            {/* 개발자 모드 row — Easter Egg 잠금 해제 시 노출 */}
            {devUnlocked && (
              <SettingsRow
                label="개발자 모드"
                value={<p className="text-caption text-text-secondary">개발자 전용 도구</p>}
                action={<ChevronRight size={16} className="text-text-caption" />}
                onClick={() => navigate("/dev")}
                isLast
              />
            )}
          </div>
        </SettingsSection>
      </section>

      {/* ⑥ 로고 + 카피라이트 */}
      <section className={`text-center mt-8 space-y-2 ${s5.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
      </section>

      {/* Toast 알림 — 하단 중앙 고정 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-toast-bg text-white text-sm px-4 py-3 rounded-lg shadow-lg whitespace-nowrap">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}
