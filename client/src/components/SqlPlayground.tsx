import { useState, memo } from "react";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import type { ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";

interface SqlPlaygroundProps {
  readonly questionUuid: string;
  readonly onExecute: (sql: string) => Promise<ExecuteResult>;
}

export const SqlPlayground = memo(function SqlPlayground({
  onExecute,
}: SqlPlaygroundProps) {
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExecute = async () => {
    if (!sql.trim()) return;
    setIsExecuting(true);
    try {
      const res = await onExecute(sql.trim());
      setResult(res);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="card-base mt-3">
      <button
        type="button"
        className="flex items-center justify-between w-full text-sm font-medium text-text-secondary"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>SQL 실행기</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="mt-3">
          <textarea
            className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: "var(--color-code-bg)",
              border: "1px solid var(--color-border)",
              minHeight: "120px",
              color: "var(--color-text-body)",
            }}
            placeholder="SELECT * FROM 테이블명;"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            spellCheck={false}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              className="btn-compact flex items-center gap-1"
              disabled={!sql.trim() || isExecuting}
              onClick={handleExecute}
            >
              <Play size={12} />
              {isExecuting ? "실행 중..." : "실행"}
            </button>
          </div>
          {result && <ResultTable result={result} />}
        </div>
      )}
    </div>
  );
});
