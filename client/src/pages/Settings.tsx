import { useState, useRef, useEffect } from "react";
import { Copy, Check, RefreshCw, WifiOff } from "lucide-react";
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

  // localStorage 초기화 2단계 확인 상태 (실수 방지)
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 섹션별 순차 페이드인 (50ms 간격)
  const stagger = useStagger();
  const s0 = stagger(0); // h1 "설정"
  const s1 = stagger(1); // 계정 섹션
  const s2 = stagger(2); // 건의사항 입력 카드
  const s3 = stagger(3); // 건의사항 목록 카드
  const s4 = stagger(4); // 앱 정보 섹션
  const s5 = stagger(5); // 개발자 도구 섹션
  const s6 = stagger(6); // 로고 + 카피라이트

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // 1차 클릭: 확인 상태로 전환 (3초 후 자동 복원)
  // 2차 클릭: localStorage 전체 삭제 + 페이지 reload
  const handleClearStorage = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearTimeout(confirmTimerRef.current!);
    localStorage.clear();
    window.location.reload();
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
              value={
                <p className="text-caption">{__APP_VERSION__}</p>
              }
              isLast
            />
          </div>
        </SettingsSection>
      </section>

      {/* ⑥ 개발자 도구 섹션 */}
      <section className={`mt-6 ${s5.className}`}>
        <SettingsSection label="개발자">
          <div className="bg-surface-card border border-border rounded-2xl">
            <SettingsRow
              label="localStorage 초기화"
              value={
                <p className="text-sm text-text-secondary">앱 데이터 전체 삭제 후 재시작</p>
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
        </SettingsSection>
      </section>

      {/* ⑦ 로고 + 카피라이트 */}
      <section className={`text-center mt-8 space-y-2 ${s6.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
      </section>
    </div>
  );
}
