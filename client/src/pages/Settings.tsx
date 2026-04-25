import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Pencil, ChevronRight, LogOut } from "lucide-react";
import { useAuthStore, getRefreshToken } from "../stores/authStore";
import { logout } from "../api/auth";
import logo from "../assets/logo/logo.png";
import NicknameChangeModal from "../components/NicknameChangeModal";
import { useStagger } from "../hooks/useStagger";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";

export default function Settings() {
  const navigate = useNavigate();
  const uuid = useAuthStore((s) => s.memberUuid ?? "");
  const nickname = useAuthStore((s) => s.nickname ?? "");
  const truncatedUuid = `${uuid.slice(0, 20)}...`;
  const clearTokens = useAuthStore((s) => s.clearTokens);
  // 닉네임 변경 모달 열림 여부
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 개발자 모드 Easter Egg — sessionStorage 복원으로 페이지 재진입 시에도 row 유지
  const [devUnlocked, setDevUnlocked] = useState(
    () => sessionStorage.getItem("devUnlocked") === "1",
  );
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
  const s2 = stagger(2); // 건의사항 row
  const s3 = stagger(3); // 앱 정보 섹션
  const s4 = stagger(4); // 로그아웃 섹션
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

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // 서버 세션 무효화 — 실패해도 로컬 토큰은 정리
        await logout(refreshToken).catch(() => {});
      }
    } finally {
      clearTokens();
      navigate("/login", { replace: true });
    }
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
          {/* flat 스타일: 카드 래퍼 없음, divide-y로 row 간 구분선 처리 */}
          <div className="bg-surface-card border-y border-border divide-y divide-border">
            <SettingsRow
              label="닉네임"
              value={
                <p className="text-sm font-bold text-text-primary">
                  {nickname || uuid.slice(0, 8)}
                </p>
              }
              action={
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center transition-colors text-text-caption hover:text-brand"
                  title="닉네임 변경"
                  onClick={() => setIsNicknameModalOpen(true)}
                >
                  <Pencil size={15} />
                </button>
              }
            />
            <SettingsRow
              label="디바이스 ID"
              value={
                <p className="font-mono text-xs text-text-secondary">
                  {truncatedUuid}
                </p>
              }
              action={
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center transition-colors"
                  title="복사"
                  onClick={handleCopy}
                >
                  {/* copied 상태: 초록 체크, 아이콘에 직접 색상 지정해 wrapper 색상 상속 차단 */}
                  {copied ? (
                    <Check size={16} className="text-sem-success" />
                  ) : (
                    <Copy
                      size={16}
                      className="text-text-caption hover:text-brand"
                    />
                  )}
                </button>
              }
            />
          </div>
        </SettingsSection>
      </section>

      {/* ③ 이용안내 섹션 — 서브페이지 진입 row */}
      <section className={s2.className}>
        <SettingsSection label="이용안내">
          <div className="bg-surface-card border-y border-border divide-y divide-border">
            <SettingsRow
              label="건의사항"
              value={<p className="text-sm text-text-secondary">의견 남기기</p>}
              action={<ChevronRight size={16} className="text-text-caption" />}
              onClick={() => navigate("/settings/feedback")}
            />
          </div>
        </SettingsSection>
      </section>

      {/* ④ 앱 정보 섹션 */}
      <section className={s3.className}>
        <SettingsSection label="앱 정보">
          <div className="bg-surface-card border-y border-border divide-y divide-border">
            <SettingsRow
              label="버전"
              value={
                <p className="text-sm text-text-caption">{__APP_VERSION__}</p>
              }
              onClick={devUnlocked ? undefined : handleVersionClick}
            />
            {/* 개발자 모드 row — Easter Egg 잠금 해제 시 노출 */}
            {devUnlocked && (
              <SettingsRow
                label="개발자 모드"
                value={
                  <p className="text-sm text-text-caption">개발자 전용 도구</p>
                }
                action={
                  <ChevronRight size={16} className="text-text-caption" />
                }
                onClick={() => navigate("/dev")}
              />
            )}
          </div>
        </SettingsSection>
      </section>

      {/* ⑤ 로그아웃 */}
      <section className={s4.className}>
        <SettingsSection label="계정 관리">
          <div className="bg-surface-card border-y border-border">
            <SettingsRow
              label="로그아웃"
              value={
                <p className="text-sm text-text-secondary">
                  {logoutLoading ? "로그아웃 중..." : "현재 계정에서 로그아웃"}
                </p>
              }
              action={
                logoutLoading ? (
                  <span className="w-4 h-4 inline-block border-2 border-text-caption border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut size={16} className="text-sem-error" />
                )
              }
              onClick={logoutLoading ? undefined : handleLogout}
            />
          </div>
        </SettingsSection>
      </section>

      {/* ⑥ 로고 + 카피라이트 */}
      <section className={`text-center mt-12 space-y-2 ${s5.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">
          © 2026 passQL. All rights reserved.
        </p>
      </section>

      {/* Toast 알림 — 하단 중앙 고정 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-brand text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-md whitespace-nowrap">
            {toastMsg}
          </div>
        </div>
      )}
      {/* 닉네임 직접 변경 모달 */}
      <NicknameChangeModal
        isOpen={isNicknameModalOpen}
        currentNickname={nickname || ""}
        onClose={() => setIsNicknameModalOpen(false)}
        onSuccess={() => {
          showToast("닉네임이 변경됐어요");
        }}
      />
    </div>
  );
}
