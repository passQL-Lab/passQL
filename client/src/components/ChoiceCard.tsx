import { memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { ChoiceItem, ExecuteResult } from "../types/api";

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
  choice, isSelected, cached, isExecutable, isExecuting, onSelect, onExecute, onAskAi,
}: ChoiceCardProps) {
  const borderClass = isSelected ? "border-brand border-2" : "border-border";
  return (
    <div className={`card-base ${borderClass}`}>
      <div className="flex items-center gap-3 mb-3">
        <button type="button" className={`radio-custom ${isSelected ? "radio-custom--selected" : ""}`} onClick={() => onSelect(choice.key, choice.body)} aria-label={`선택지 ${choice.key}`} />
        <span className="text-body font-bold">{choice.key}</span>
      </div>
      <pre className="code-block text-sm"><code>{choice.body}</code></pre>
      {isExecutable && (
        <div className="flex justify-end mt-2">
          <button className="btn-compact" type="button" onClick={() => onExecute(choice.key, choice.body)} disabled={!!cached || isExecuting}>
            {isExecuting ? "실행 중..." : "실행"}
          </button>
        </div>
      )}
      {cached && !cached.errorCode && (
        <div className="success-card mt-3">
          <p className="text-sm font-medium" style={{ color: "var(--color-sem-success-text)" }}>
            <Check size={14} className="inline" /> {cached.rowCount}행 · {cached.elapsedMs}ms
          </p>
          {cached.columns.length > 0 && (
            <table className="data-table mt-2">
              <thead><tr>{cached.columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
              <tbody>{cached.rows.map((row, i) => <tr key={i}>{(row as unknown[]).map((cell, j) => <td key={j}>{String(cell)}</td>)}</tr>)}</tbody>
            </table>
          )}
        </div>
      )}
      {cached?.errorCode && (
        <div className="error-card mt-3">
          <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
            <AlertTriangle size={14} className="inline" /> {cached.errorCode}
          </span>
          <p className="text-secondary mt-1">{cached.errorMessage}</p>
          <div className="flex justify-end mt-2">
            <button
              className="text-brand text-sm font-medium"
              type="button"
              onClick={() => onAskAi?.(choice.key, cached?.errorCode ?? "", cached?.errorMessage ?? "")}
            >
              AI에게 물어보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
