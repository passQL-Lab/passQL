import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  useCheckNickname,
  useChangeNickname,
  useRegenerateNickname,
} from "../hooks/useMember";

// lucide-react에 주사위 아이콘이 없어 SVG 인라인으로 정의
function DiceIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="16.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
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

  const checkNickname = useCheckNickname();
  const changeNickname = useChangeNickname();
  const regenerateNickname = useRegenerateNickname();

  // 모달 열릴 때 상태 초기화 + input 포커스
  useEffect(() => {
    if (!isOpen) return;

    setValue(currentNickname);
    setCheckResult(null);
    setErrorMsg(null);

    // 렌더 직후 포커스 — setTimeout으로 DOM 안정화 대기
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

    // 이전 overflow 저장 후 복원 — 중첩 모달 대응
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // input 변경 시 중복확인 상태 리셋 — 변경된 닉네임은 재확인 필요
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setCheckResult(null);
    setErrorMsg(null);
  };

  // 클리어 버튼: 값 초기화 + 포커스 복귀
  const handleClear = () => {
    setValue("");
    setCheckResult(null);
    setErrorMsg(null);
    inputRef.current?.focus();
  };

  // 주사위 버튼: 랜덤 닉네임 생성 후 input 채움
  const handleRegenerate = async () => {
    try {
      const result = await regenerateNickname.mutateAsync(undefined);
      setValue(result.nickname);
      // 새로 생성된 닉네임은 중복확인 초기화 — 서버 생성이지만 UI 일관성 유지
      setCheckResult(null);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "닉네임 생성에 실패했어요");
    }
  };

  // 중복확인 버튼
  const handleCheck = async () => {
    setErrorMsg(null);
    try {
      const result = await checkNickname.mutateAsync(value);
      setCheckResult(result.available);
      if (!result.available) {
        setErrorMsg("이미 사용 중인 닉네임이에요");
      }
    } catch (err) {
      setCheckResult(false);
      setErrorMsg(err instanceof Error ? err.message : "중복 확인에 실패했어요");
    }
  };

  // 저장 버튼: 닉네임 변경 후 콜백 호출
  const handleSave = async () => {
    try {
      const result = await changeNickname.mutateAsync(value);
      onSuccess(result.nickname);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "닉네임 변경에 실패했어요");
    }
  };

  // 상태 메시지 색상: checkResult 기반 분기
  const statusTextClass =
    checkResult === true
      ? "text-sem-success"
      : checkResult === false
      ? "text-sem-error"
      : "text-text-caption";

  // 중복확인 버튼 색상: 확인 완료 시 success 테두리 표시
  const checkBtnClass =
    checkResult === true
      ? "btn btn-outline border-sem-success text-sem-success"
      : checkResult === false
      ? "btn btn-outline border-sem-error text-sem-error"
      : "btn btn-outline";

  const isLoading =
    checkNickname.isPending || changeNickname.isPending || regenerateNickname.isPending;

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

        {/* 입력 영역 */}
        <div className="flex gap-2">
          {/* input + 클리어 버튼 묶음 */}
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
            {/* value 있을 때만 클리어 버튼 표시 */}
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

          {/* 주사위(랜덤) 버튼 */}
          <button
            type="button"
            className="h-12 w-12 border border-border rounded-xl flex items-center justify-center text-text-secondary hover:bg-base-200 disabled:opacity-50 shrink-0"
            onClick={handleRegenerate}
            disabled={isLoading}
            aria-label="랜덤 닉네임 생성"
          >
            {regenerateNickname.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <DiceIcon size={20} />
            )}
          </button>
        </div>

        {/* 상태 메시지 */}
        <p className={`text-sm min-h-[1.25rem] ${statusTextClass}`}>
          {checkResult === true && "사용 가능한 닉네임이에요"}
          {checkResult === false && (errorMsg ?? "사용할 수 없는 닉네임이에요")}
          {checkResult === null && errorMsg}
        </p>

        {/* 버튼 행 */}
        <div className="flex gap-2">
          {/* 중복확인 버튼 */}
          <button
            type="button"
            className={`${checkBtnClass} flex-1`}
            onClick={handleCheck}
            disabled={!value || isLoading}
          >
            {checkNickname.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : checkResult === true ? (
              "확인완료"
            ) : (
              "중복확인"
            )}
          </button>

          {/* 저장 버튼 — 중복확인 통과 후에만 활성화 */}
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={handleSave}
            disabled={checkResult !== true || isLoading}
          >
            {changeNickname.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "저장"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
