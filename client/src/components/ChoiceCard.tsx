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
  const borderClass = isSelected ? "border-brand border-2" : "border-border";

  return (
    <div className={`card-base ${borderClass}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={`radio-custom mt-0.5 shrink-0 ${isSelected ? "radio-custom--selected" : ""}`}
          onClick={() => onSelect(choice.key, choice.body)}
          aria-label={`선택지 ${choice.key}`}
        />
        <div className="flex-1 min-w-0">
          <span className="text-body font-bold text-sm mb-2 block">{choice.key}</span>
          <pre className="code-block text-sm"><code>{choice.body}</code></pre>
          {isExecutable && (
            <div className="flex justify-end mt-2">
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
          {cached && (
            <ResultTable
              result={cached}
              onAskAi={
                cached.errorCode
                  ? () => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
});
