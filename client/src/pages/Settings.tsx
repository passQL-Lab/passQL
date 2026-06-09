import { useState, useRef, useEffect } from "react";
// Settings는 마이페이지 톱니바퀴로 진입하는 서브페이지 — 닉네임/계정 정보는 MyPage에서 관리, 여기선 문제풀이 모드·이용안내·앱정보만 다룸
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuthStore, getRefreshToken } from "../stores/authStore";
import { logout } from "../api/auth";
import logo from "../assets/logo/logo.png";
import { useStagger } from "../hooks/useStagger";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";
import SubpageLayout from "../components/SubpageLayout";
import { useMember, useUpdateChoiceGenerationMode } from "../hooks/useMember";
import type { ChoiceGenerationMode } from "../types/api";

export default function Settings() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const [logoutLoading, setLogoutLoading] = useState(false);
  // 문제풀이 섹션 — 선택지 생성 모드 토글
  const { data: memberData } = useMember();
  const { mutate: updateMode, isPending: isModeUpdating } = useUpdateChoiceGenerationMode();
  const currentMode: ChoiceGenerationMode = memberData?.choiceGenerationMode ?? "PRACTICE";

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stagger = useStagger();
  const s0 = stagger(0); // 이용안내 섹션
  const s1 = stagger(1); // 문제풀이 섹션
  const s2 = stagger(2); // 앱 정보 섹션
  const s3 = stagger(3); // 로그아웃 섹션
  const s4 = stagger(4); // 로고 + 카피라이트

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken).catch(() => {});
      }
    } finally {
      clearTokens();
      navigate("/login", { replace: true });
    }
  };

  return (
    <SubpageLayout title="설정">
      {/* 문제풀이 섹션 — 선택지 생성 모드 토글 */}
      <section className={s0.className}>
        <SettingsSection label="문제풀이" isFirst>
          <div className="bg-surface-card border-y border-border">
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-text-primary">선택지 생성 모드</span>
                <div className="flex gap-1 bg-surface rounded-lg p-0.5">
                  <button
                    type="button"
                    disabled={isModeUpdating || currentMode === "PRACTICE"}
                    onClick={() => updateMode("PRACTICE")}
                    className={`text-xs px-3 py-1 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentMode === "PRACTICE"
                        ? "bg-brand text-white"
                        : "text-text-caption hover:text-text-secondary"
                    }`}
                  >
                    연습
                  </button>
                  <button
                    type="button"
                    disabled={isModeUpdating || currentMode === "REAL"}
                    onClick={() => updateMode("REAL")}
                    className={`text-xs px-3 py-1 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentMode === "REAL"
                        ? "bg-brand text-white"
                        : "text-text-caption hover:text-text-secondary"
                    }`}
                  >
                    실전
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-caption">
                {currentMode === "PRACTICE"
                  ? "기존 검증된 선택지 재사용 → 빠르게 시작"
                  : "매번 새 선택지 AI 생성 → 대기 있음"}
              </p>
            </div>
          </div>
        </SettingsSection>
      </section>

      {/* 이용안내 섹션 — 서브페이지 진입 row */}
      <section className={s1.className}>
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

      {/* 앱 정보 섹션 */}
      <section className={s2.className}>
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

      {/* 로그아웃 */}
      <section className={s3.className}>
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

      {/* 로고 + 카피라이트 */}
      <section className={`text-center mt-12 space-y-2 ${s4.className}`}>
        <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
        <p className="text-xs text-text-caption">
          © 2026 passQL. All rights reserved.
        </p>
      </section>
    </SubpageLayout>
  );
}
