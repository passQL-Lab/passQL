import { memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { ExecuteResult } from "../types/api";

interface ResultTableProps {
  readonly result: ExecuteResult;
  readonly onAskAi?: () => void;
}

export const ResultTable = memo(function ResultTable({ result, onAskAi }: ResultTableProps) {
  if (result.errorCode) {
    return (
      <div className="error-card mt-3">
        <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
          <AlertTriangle size={14} className="inline mr-1" />
          {result.errorCode}
        </span>
        <p className="text-secondary mt-1 text-sm">{result.errorMessage}</p>
        {onAskAi && (
          <div className="flex justify-end mt-2">
            <button
              className="text-brand text-sm font-medium"
              type="button"
              onClick={onAskAi}
            >
              AI에게 물어보기
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="success-card mt-3">
      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-sem-success-text)" }}>
        <Check size={14} className="inline mr-1" />
        {result.rowCount}행 · {result.elapsedMs}ms
      </p>
      {result.columns.length > 0 && (
        <div
          className="overflow-x-auto rounded-xl border mt-2"
          style={{ borderColor: "var(--color-border)" }}
        >
          <table className="data-table w-full">
            <thead>
              <tr>
                {result.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {(row as unknown[]).map((cell, j) => (
                    <td key={j}>{String(cell ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
