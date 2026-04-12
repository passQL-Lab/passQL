import { useState, memo } from "react";
import { Terminal, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";

interface SqlPlaygroundProps {
  readonly onExecute: (sql: string) => Promise<ExecuteResult>;
}

export const SqlPlayground = memo(function SqlPlayground({
  onExecute,
}: SqlPlaygroundProps) {
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExecute = async () => {
    if (!sql.trim()) return;
    setIsExecuting(true);
    setNetworkError(null);
    try {
      const res = await onExecute(sql.trim());
      // SQL 문법/런타임 오류는 res.errorCode로 내려오므로 ResultTable이 처리
      setResult(res);
    } catch (err) {
      // 네트워크 오류·5xx 등 API 호출 자체가 실패한 경우 — 이전 결과 초기화
      setResult(null);
      setNetworkError(err instanceof Error ? err.message : "실행 요청에 실패했습니다");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="card-base mt-3">
      <button
        type="button"
        className="flex items-center justify-between w-full"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-base-content/50 shrink-0" />
          <span className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">
            직접 실행해보기
          </span>
        </div>
        {isOpen
          ? <ChevronUp size={14} className="text-base-content/30" />
          : <ChevronDown size={14} className="text-base-content/30" />}
      </button>

      {isOpen && (
        <div className="mt-3">
          <textarea
            className="sql-playground-textarea"
            placeholder="SELECT * FROM 테이블명;"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            spellCheck={false}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              className="btn-run-all"
              disabled={!sql.trim() || isExecuting}
              onClick={handleExecute}
            >
              {!isExecuting && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {isExecuting ? "실행 중…" : "쿼리 실행"}
            </button>
          </div>
          {networkError && (
            <div className="error-card mt-2 flex items-start gap-2">
              <AlertTriangle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error leading-snug">{networkError}</p>
            </div>
          )}
          {result && <ResultTable result={result} />}
        </div>
      )}
    </div>
  );
});
