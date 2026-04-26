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
import { useMember } from "../hooks/useMember";
import { isNicknameCooldown, formatNicknameCooldownMessage } from "../lib/dateUtil";

export default function Settings() {
  const navigate = useNavigate();
  const uuid = useAuthStore((s) => s.memberUuid ?? "");
  const nickname = useAuthStore((s) => s.nickname ?? "");
  const truncatedUuid = `${uuid.slice(0, 20)}...`;
  // nicknameChangedAt을 /members/me 캐시에서 가져옴 — 쿨다운 체크에 사용
  const { data: memberData } = useMember();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  // 닉네임 변경 모달 열림 여부
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 연필 클릭 시 쿨다운 중이면 토스트만 표시, 아니면 모달 오픈
  const handleNicknameEditClick = () => {
    const changedAt = memberData?.nicknameChangedAt ?? null;
    if (isNicknameCooldown(changedAt)) {
      showToast(formatNicknameCooldownMessage(changedAt!));
      return;
    }
    setIsNicknameModalOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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
                  onClick={handleNicknameEditClick}
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
            />
          </div>
        </SettingsSection>
      </section>

      {/* ⑤ 로그아웃 */}
      <section className={s4.className}>
        <SettingsSection label="계정 관리">
          <div className="bg-surface-card border-y border-border">
            <button
              type="button"
              disabled={logoutLoading}
              onClick={handleLogout}
              className="flex items-center justify-between px-4 py-3.5 w-full text-left cursor-pointer hover:bg-surface active:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium text-sem-error">
                {logoutLoading ? "로그아웃 중..." : "로그아웃"}
              </span>
              {logoutLoading ? (
                <span className="w-4 h-4 inline-block border-2 border-sem-error border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={16} className="text-sem-error" />
              )}
            </button>
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
