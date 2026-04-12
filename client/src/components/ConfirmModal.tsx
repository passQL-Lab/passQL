import { useEffect } from "react";

interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  // 파괴적 액션 레이블 (예: "나가기") — Secondary 버튼
  readonly confirmLabel: string;
  // 유지 액션 레이블 (예: "계속 풀기") — Primary 버튼
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // ESC 키로 모달 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    // 이전 overflow 값 저장 후 복원 — 중첩 모달 대응
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    // 오버레이 — 클릭 시 이탈 취소
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}
      onClick={onCancel}
    >
      {/* 모달 카드 — 클릭 이벤트 버블링 방지 */}
      <div
        className="w-full bg-white border border-border rounded-t-2xl px-5 pt-5 pb-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 인디케이터 */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto" />

        <div className="space-y-1.5 text-center">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        <div className="flex flex-col gap-2">
          {/* 유지 액션: Primary 버튼 (파괴적 액션 비강조 원칙) */}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          {/* 파괴적 액션: Secondary 버튼 */}
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
