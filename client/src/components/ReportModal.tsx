import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
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
  { value: "WRONG_ANSWER", label: "정답이 잘못된 것 같아요" },
  { value: "WEIRD_QUESTION", label: "문제 내용이 이상해요" },
  { value: "WEIRD_CHOICES", label: "선택지가 이상해요" },
  { value: "WEIRD_EXECUTION", label: "SQL 실행 결과가 이상해요" },
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* 헤더 — Flag 아이콘 + 타이틀 */}
        <div className="flex items-center gap-2 mb-5">
          <div className="feedback-bar-icon--error w-7 h-7 rounded-full flex items-center justify-center shrink-0">
            <Flag size={13} className="feedback-bar-heading--error" />
          </div>
          <h3 className="font-bold text-lg text-text-primary">문제 신고</h3>
        </div>

        {/* 카테고리 선택 */}
        <div className="flex flex-col mb-5">
          {CATEGORIES.map(({ value, label }) => {
            const isSelected = selected.has(value);
            return (
              <label
                key={value}
                className={`report-category-row ${isSelected ? "report-category-row--selected" : ""} ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className={`report-radio ${isSelected ? "report-radio--selected" : ""}`}>
                  {isSelected && <span className="report-radio-dot" />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => toggle(value)}
                  disabled={loading}
                />
                <span className={isSelected ? "report-category-label--selected" : "report-category-label"}>
                  {label}
                </span>
              </label>
            );
          })}

          {/* ETC 선택 시 상세 입력 textarea 표시 */}
          {selected.has("ETC") && (
            <textarea
              className="report-textarea mt-2"
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
          <p className="error-code-text text-sm mb-3">{error}</p>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button type="button" className="btn-report" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "신고하기"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
