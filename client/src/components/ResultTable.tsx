import { memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { ExecuteResult } from "../types/api";

interface ResultTableProps {
  readonly result: ExecuteResult;
  readonly onAskAi?: () => void;
  // 파란 선택 카드 위에서 사용 시 true — 흰색 계열 텍스트로 반전
  readonly inverted?: boolean;
}

export const ResultTable = memo(function ResultTable({ result, onAskAi, inverted = false }: ResultTableProps) {
  if (result.errorCode) {
    return (
      <div className="error-card mt-3">
        <span className="text-code font-bold error-code-text">
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
    <div className="mt-2">
      {/* 실행 결과 레이블 + 행 수·소요 시간 */}
      <p className={inverted ? "result-table-meta--inverted" : "result-table-meta"}>
        <Check size={12} className="inline mr-0.5" aria-hidden="true" />
        실행결과 · {result.rowCount}행 · {result.elapsedMs}ms
      </p>
      {result.columns.length > 0 && (
        <div className={`overflow-hidden rounded-xl ${inverted ? "result-table-border--inverted" : "result-table-border"}`}>
          <div className="overflow-x-auto">
            <table className={`data-table w-full ${inverted ? "data-table--inverted" : ""}`}>
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
                      <td key={j} className={cell == null ? "result-table-null" : ""}>
                        {cell == null ? "NULL" : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
