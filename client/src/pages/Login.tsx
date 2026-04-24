import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../lib/firebase";
import { login, type AuthProvider } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { ApiError } from "../api/client";
import { fetchLegal, type LegalType } from "../api/legal";
import MarkdownText from "../components/MarkdownText";
import logo from "../assets/logo/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<LegalType | null>(null);

  const isLoading = loadingProvider !== null;

  const handleGoogleLogin = async () => {
    setLoadingProvider("GOOGLE");
    setError(null);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
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
      setLoadingProvider(null);
    }
  };

  const handleUnavailable = (provider: AuthProvider) => {
    setError(`${provider} 로그인은 준비 중입니다.`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] grid place-items-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="passQL" className="h-10 mb-3" />
          <p className="text-[#6B7280] text-sm text-center">
            SQL 자격증 합격을 위한 AI 문제풀이
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="w-full bg-white border border-[#E5E7EB] rounded-xl p-8">
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="btn-social btn-social--google"
            >
              {loadingProvider === "GOOGLE"
                ? <span className="loading loading-spinner loading-sm" />
                : <GoogleIcon />
              }
              Google로 계속하기
            </button>

            <button
              onClick={() => handleUnavailable("KAKAO")}
              disabled={isLoading}
              className="btn-social btn-social--kakao"
            >
              {loadingProvider === "KAKAO"
                ? <span className="loading loading-spinner loading-sm" />
                : <KakaoIcon />
              }
              카카오로 계속하기
            </button>

            <button
              onClick={() => handleUnavailable("NAVER")}
              disabled={isLoading}
              className="btn-social btn-social--naver"
            >
              {loadingProvider === "NAVER"
                ? <span className="loading loading-spinner loading-sm" />
                : <NaverIcon />
              }
              네이버로 계속하기
            </button>

            <button
              onClick={() => handleUnavailable("GITHUB")}
              disabled={isLoading}
              className="btn-social btn-social--github"
            >
              {loadingProvider === "GITHUB"
                ? <span className="loading loading-spinner loading-sm" />
                : <GithubIcon />
              }
              GitHub로 계속하기
            </button>

            <button
              onClick={() => handleUnavailable("APPLE")}
              disabled={isLoading}
              className="btn-social btn-social--apple"
            >
              {loadingProvider === "APPLE"
                ? <span className="loading loading-spinner loading-sm" />
                : <AppleIcon />
              }
              Apple로 계속하기
            </button>
          </div>

          {error && (
            <p className="mt-4 text-[#EF4444] text-sm text-center">{error}</p>
          )}
        </div>

        {/* 약관 동의 안내 */}
        <p className="mt-6 text-center text-[#9CA3AF] text-xs">
          로그인하면{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-[#6B7280] transition-colors"
            onClick={() => setLegalModal("TERMS_OF_SERVICE")}
          >
            이용약관
          </button>
          {" "}및{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-[#6B7280] transition-colors"
            onClick={() => setLegalModal("PRIVACY_POLICY")}
          >
            개인정보처리방침
          </button>
          에 동의하게 됩니다
        </p>
      </div>

      {/* daisyUI 반응형 모달 — 모바일 하단 시트, 데스크톱 중앙 */}
      {legalModal !== null && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}

function LegalModal({
  type,
  onClose,
}: {
  readonly type: LegalType;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // 모달 열기 + 닫힐 때 onClose 연동
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // 약관 내용 fetch
  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    fetchLegal(type)
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box flex flex-col max-h-[80vh] p-0 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <h3 className="text-base font-bold text-[#111827]">
            {title ?? (loading ? "" : "약관")}
          </h3>
          <form method="dialog">
            <button
              type="submit"
              className="btn btn-sm btn-circle btn-ghost text-[#9CA3AF]"
              aria-label="닫기"
            >
              ✕
            </button>
          </form>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          {loading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-[#4F46E5]" />
            </div>
          )}
          {fetchError && (
            <p className="text-sm text-[#EF4444] text-center py-8">
              약관을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </p>
          )}
          {!loading && !fetchError && content && (
            <div className="prose prose-sm max-w-none text-[#374151]">
              <MarkdownText text={content} animated={false} />
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>
      {/* 오버레이 클릭 시 닫기 */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">닫기</button>
      </form>
    </dialog>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.582 1 1 3.806 1 7.25c0 2.196 1.378 4.126 3.456 5.22l-.88 3.274a.25.25 0 0 0 .376.277L7.74 13.73A10.1 10.1 0 0 0 9 13.5c4.418 0 8-2.806 8-6.25S13.418 1 9 1Z"
        fill="#191919"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M10.265 9.27 7.354 1H1v16h7.735V8.73L11.646 17H18V1h-7.735z" fill="#FFFFFF" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 .5A8.5 8.5 0 0 0 .5 9c0 3.75 2.432 6.93 5.806 8.054.424.078.579-.184.579-.409 0-.202-.007-.737-.011-1.447-2.36.513-2.858-1.137-2.858-1.137-.386-.981-.943-1.242-.943-1.242-.77-.527.058-.516.058-.516.852.06 1.3.875 1.3.875.757 1.297 1.986.922 2.47.705.077-.548.296-.923.539-1.135-1.884-.214-3.865-.942-3.865-4.19 0-.926.33-1.683.873-2.276-.088-.214-.378-1.077.082-2.245 0 0 .712-.228 2.332.87A8.12 8.12 0 0 1 9 4.868a8.12 8.12 0 0 1 2.127.286c1.618-1.098 2.328-.87 2.328-.87.462 1.168.172 2.031.085 2.245.543.593.871 1.35.871 2.276 0 3.256-1.984 3.973-3.873 4.183.305.263.576.78.576 1.572 0 1.135-.01 2.05-.01 2.329 0 .227.153.491.583.408A8.501 8.501 0 0 0 17.5 9 8.5 8.5 0 0 0 9 .5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M14.045 9.58c-.02-2.02 1.65-2.99 1.724-3.04-1.408-1.058-2.584-.953-3.162-.935-1.117.117-2.196.674-2.763.674-.568 0-1.432-.66-2.363-.641-1.203.018-2.32.715-2.937 1.802C3.155 9.57 4.05 13.35 5.52 15.38c.73 1.043 1.595 2.21 2.728 2.169 1.099-.044 1.513-.707 2.841-.707 1.328 0 1.708.707 2.864.683 1.184-.02 1.929-1.057 2.647-2.106a9.87 9.87 0 0 0 1.196-2.431c-.028-.012-2.29-.879-2.314-3.408h.563ZM11.76 3.403c.605-.74.993-1.777.884-2.803-.855.036-1.89.571-2.503 1.291-.55.637-1.03 1.653-.9 2.628.956.073 1.913-.487 2.52-1.116Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
