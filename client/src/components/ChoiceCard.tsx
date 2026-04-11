import { memo } from "react";
import type { ChoiceItem, ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";

interface ChoiceCardProps {
  readonly choice: ChoiceItem;
  readonly isSelected: boolean;
  readonly cached: ExecuteResult | undefined;
  readonly isExecutable: boolean;
  readonly isExecuting: boolean;
  readonly onSelect: (key: string, sql: string) => void;
  readonly onExecute: (key: string, sql: string) => void;
  readonly onAskAi?: (choiceKey: string, errorCode: string, errorMessage: string) => void;
}

export const ChoiceCard = memo(function ChoiceCard({
  choice,
  isSelected,
  cached,
  isExecutable,
  isExecuting,
  onSelect,
  onExecute,
  onAskAi,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-2xl p-4 transition-all duration-200"
      style={{
        backgroundColor: isSelected
          ? "var(--color-brand-light)"
          : "var(--color-surface-card)",
        border: `1px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
        borderLeft: `4px solid ${isSelected ? "var(--color-brand)" : "transparent"}`,
      }}
      onClick={() => onSelect(choice.key, choice.body)}
    >
      {/* 선택지 본문 — 줄바꿈 허용, 모노 폰트 */}
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
      >
        {choice.body}
      </p>

      {/* EXECUTABLE: 실행 버튼 (클릭 버블링 차단) */}
      {isExecutable && (
        <div
          className="flex justify-end mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn-compact"
            type="button"
            onClick={() => onExecute(choice.key, choice.body)}
            disabled={!!cached || isExecuting}
          >
            {isExecuting ? "실행 중..." : "실행"}
          </button>
        </div>
      )}

      {/* 실행 결과 테이블 (클릭 버블링 차단) */}
      {cached && (
        <div onClick={(e) => e.stopPropagation()}>
          <ResultTable
            result={cached}
            onAskAi={
              cached.errorCode
                ? () => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")
                : undefined
            }
          />
        </div>
      )}
    </button>
  );
});
