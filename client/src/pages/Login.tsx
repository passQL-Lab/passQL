import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../lib/firebase";
import { login } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { ApiError } from "../api/client";
import logo from "../assets/logo/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Firebase Google 팝업 → idToken 획득
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 백엔드에 idToken 전달 → JWT 발급
      const response = await login({ authProvider: "GOOGLE", idToken });

      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        memberUuid: response.memberUuid,
        nickname: response.nickname,
      });

      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      } else if (err instanceof Error && err.message.includes("popup-closed-by-user")) {
        // 사용자가 팝업을 직접 닫은 경우 — 에러 메시지 불필요
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="passQL" className="h-10 mb-3" />
          <p className="text-[#6B7280] text-sm text-center">
            SQL 자격증 합격을 위한 AI 문제풀이
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8">
          <h1 className="text-[#111827] text-xl font-bold mb-2">로그인</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            소셜 계정으로 간편하게 시작하세요
          </p>

          {/* Google 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] rounded-lg h-11 text-[#111827] text-sm font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <GoogleIcon />
            )}
            Google로 계속하기
          </button>

          {/* 에러 메시지 */}
          {error && (
            <p className="mt-4 text-[#EF4444] text-sm text-center">{error}</p>
          )}
        </div>

        <p className="mt-6 text-center text-[#9CA3AF] text-xs">
          로그인하면 이용약관 및 개인정보처리방침에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
