import { useEffect, useState } from "react";
import { submitReport } from "../api/reports";
import type { ReportCategory } from "../api/reports";
import { ApiError } from "../api/client";
import { useMemberStore } from "../stores/memberStore";

interface ReportModalProps {
  readonly questionUuid: string;
  readonly submissionUuid: string;
  readonly choiceSetUuid?: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

// 신고 카테고리 목록 — 표시 레이블 포함
const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "WRONG_ANSWER", label: "정답이 틀렸다" },
  { value: "WEIRD_QUESTION", label: "문제 자체가 이상하다" },
  { value: "WEIRD_CHOICES", label: "선택지가 이상하다" },
  { value: "WEIRD_EXECUTION", label: "SQL 실행 결과가 이상하다" },
  { value: "ETC", label: "기타" },
];

export default function ReportModal({
  questionUuid,
  submissionUuid,
  choiceSetUuid,
  onClose,
  onSuccess,
}: ReportModalProps) {
  // memberStore의 uuid 필드 — API 인증 헤더에 사용
  const memberUuid = useMemberStore((s) => s.uuid);
  const [selected, setSelected] = useState<Set<ReportCategory>>(new Set());
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC 키로 모달 닫기 + 배경 스크롤 잠금
  useEffect(() => {
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
  }, [onClose]);

  const toggle = (cat: ReportCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // 제출 가능 조건: 1개 이상 선택 + ETC 선택 시 detail 필수 + 제출 중 아님
  const canSubmit =
    selected.size > 0 &&
    (!selected.has("ETC") || detail.trim().length > 0) &&
    !loading;

  const handleSubmit = async () => {
    if (!memberUuid || !canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await submitReport(questionUuid, memberUuid, {
        submissionUuid,
        choiceSetUuid,
        categories: [...selected],
        // ETC 카테고리를 선택했을 때만 detail 전송
        detail: selected.has("ETC") ? detail.trim() : undefined,
      });
      onSuccess();
    } catch (err) {
      // 409: 이미 신고한 제출 — 성공으로 처리하여 버튼 비활성화 + 모달 닫기
      if (err instanceof ApiError && err.status === 409) {
        onSuccess();
      } else {
        setError("신고 제출에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // dialog 오버레이 — modal-open으로 항상 표시
    <dialog className="modal modal-open">
      {/* 모달 박스 — 클릭 이벤트 버블링 방지 */}
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4 text-text-primary">문제 신고</h3>

        <div className="flex flex-col gap-3 mb-4">
          {CATEGORIES.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selected.has(value)}
                onChange={() => toggle(value)}
                disabled={loading}
              />
              <span className="text-sm text-text-primary">{label}</span>
            </label>
          ))}

          {/* ETC 선택 시 상세 입력 textarea 표시 */}
          {selected.has("ETC") && (
            <textarea
              className="textarea textarea-bordered text-sm mt-1 w-full"
              placeholder="구체적인 내용을 입력해주세요"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={loading}
            />
          )}
        </div>

        {/* 에러 메시지 — API 호출 실패 시 표시 */}
        {error && (
          <p className="text-sm text-error mb-2">{error}</p>
        )}

        <div className="modal-action">
          {/* 취소 버튼 — 제출 중에는 비활성화 */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>

          {/* 신고 제출 버튼 — canSubmit 조건 미충족 시 비활성화 */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "신고하기"
            )}
          </button>
        </div>
      </div>

      {/* 배경 클릭 시 모달 닫기 */}
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
