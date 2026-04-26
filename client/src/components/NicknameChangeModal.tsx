import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useCheckNickname, useChangeNickname } from "../hooks/useMember";
import { ApiError } from "../api/client";

// ApiError.body.message → 한국어 서버 메시지 우선, fallback은 기본 문구
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as Record<string, unknown> | null;
    if (typeof body?.message === "string") return body.message;
  }
  return fallback;
}

interface NicknameChangeModalProps {
  readonly isOpen: boolean;
  readonly currentNickname: string;
  readonly onClose: () => void;
  readonly onSuccess: (newNickname: string) => void;
}

export default function NicknameChangeModal({
  isOpen,
  currentNickname,
  onClose,
  onSuccess,
}: NicknameChangeModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(currentNickname);
  // null = 미확인, true = 사용가능, false = 사용불가
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checkNickname = useCheckNickname();
  const changeNickname = useChangeNickname();

  // 모달 열릴 때 상태 초기화 + input 포커스
  useEffect(() => {
    if (!isOpen) return;

    setValue(currentNickname);
    setCheckResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, currentNickname]);

  // ESC 키로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // input 변경 시 중복확인 상태 리셋 — 다시 확인 필요
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setCheckResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClear = () => {
    setValue("");
    setCheckResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    inputRef.current?.focus();
  };

  // 중복확인 버튼
  const handleCheck = async () => {
    if (!value) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await checkNickname.mutateAsync(value);
      setCheckResult(result.available);
      if (result.available) {
        setSuccessMsg("사용 가능한 닉네임이에요");
      } else {
        setErrorMsg("이미 사용 중인 닉네임이에요");
      }
    } catch (err) {
      setCheckResult(false);
      setErrorMsg(extractErrorMessage(err, "중복 확인에 실패했어요"));
    }
  };

  // 저장: 중복확인 통과 상태에서만 호출됨
  const handleSave = async () => {
    try {
      const result = await changeNickname.mutateAsync(value);
      onSuccess(result.nickname);
      onClose();
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "닉네임 변경에 실패했어요"));
    }
  };

  const isLoading = checkNickname.isPending || changeNickname.isPending;

  // 기존 닉네임과 동일하면 중복확인 버튼 비활성 + 저장 불가 안내
  const isSameAsCurrent = value === currentNickname;
  // 중복확인 통과했을 때만 저장 버튼 활성화
  const canSave = checkResult === true;

  // 중복확인 버튼: 미확인이면 primary, 통과면 success 테두리, 실패면 error 테두리
  const checkBtnClass =
    checkResult === true
      ? "btn btn-sm h-12 px-3 shrink-0 border border-sem-success text-sem-success bg-transparent"
      : checkResult === false
      ? "btn btn-sm h-12 px-3 shrink-0 border border-sem-error text-sem-error bg-transparent"
      : "btn btn-sm h-12 px-3 shrink-0 border border-brand bg-brand text-white";

  // 상태 메시지
  const statusMsg = isSameAsCurrent
    ? "닉네임을 변경해주세요"
    : (errorMsg ?? successMsg);
  const statusTextClass = isSameAsCurrent
    ? "text-text-caption"
    : errorMsg
    ? "text-sem-error"
    : "text-sem-success";

  return (
    // 오버레이 — 클릭 시 닫힘
    <div
      className="fixed inset-0 z-40 bg-black/50"
      onClick={onClose}
    >
      {/* 바텀시트 — 클릭 이벤트 버블링 방지 */}
      <div
        className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-surface-card px-5 pt-4 pb-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="h-1 w-9 rounded-full bg-border mx-auto" />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-h2 font-bold text-text-primary">닉네임 변경</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 안내 문구 */}
        <p className="text-sm text-text-secondary">
          한글, 영문, 숫자만 사용 가능 · 2~10자
          <br />
          변경 후 3일간 다시 바꿀 수 없어요
        </p>

        {/* 입력 영역 — input + X 클리어 + 중복확인 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered w-full h-12 pr-9"
              value={value}
              onChange={handleChange}
              maxLength={10}
              placeholder="닉네임 입력"
              disabled={isLoading}
            />
            {value && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-caption hover:text-text-secondary"
                onClick={handleClear}
                aria-label="입력 지우기"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* 중복확인 버튼 — 미확인 시 primary로 강조 */}
          <button
            type="button"
            className={checkBtnClass}
            onClick={handleCheck}
            disabled={!value || isSameAsCurrent || isLoading}
          >
            {checkNickname.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : checkResult === true ? (
              "확인완료"
            ) : (
              "중복확인"
            )}
          </button>
        </div>

        {/* 상태 메시지 */}
        <p className={`text-sm min-h-[1.25rem] ${statusTextClass}`}>
          {statusMsg}
        </p>

        {/* 저장 버튼 — 중복확인 통과 전까지 disabled */}
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={handleSave}
          disabled={!canSave || isLoading}
        >
          {changeNickname.isPending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "저장"
          )}
        </button>
      </div>
    </div>
  );
}
