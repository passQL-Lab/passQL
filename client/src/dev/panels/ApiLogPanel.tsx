// src/dev/panels/ApiLogPanel.tsx
import { useState } from "react";
import { useDevContext } from "../DevProvider";
import type { ApiLogEntry } from "../DevProvider";

// 상태에 따라 텍스트 색상 반환
function statusColor(entry: ApiLogEntry): string {
  if (entry.status === "pending") return "text-text-secondary";
  if (entry.status === "ok") return "text-sem-success";
  return "text-sem-error";
}

function MethodBadge({ method }: { readonly method: string }) {
  // HTTP 메서드별 시각적 구분 — GET/POST/기타 색상 분리
  const color =
    method === "GET"
      ? "text-brand"
      : method === "POST"
        ? "text-sem-warning"
        : "text-text-secondary";
  return <span className={`font-mono text-xs font-bold ${color}`}>{method}</span>;
}

export function ApiLogPanel() {
  const { logs, clearLogs } = useDevContext();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-primary">
          API 로그 (최근 {logs.length}건)
        </span>
        <button
          type="button"
          onClick={clearLogs}
          className="text-xs text-text-caption hover:text-sem-error transition-colors"
        >
          초기화
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {logs.length === 0 && (
          <p className="text-xs text-text-caption text-center py-6">API 호출 없음</p>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className="border-b border-border last:border-0">
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-surface transition-colors"
              onClick={() =>
                setExpanded(expanded === entry.id ? null : entry.id)
              }
            >
              <div className="flex items-center gap-2">
                <MethodBadge method={entry.method} />
                <span className="font-mono text-xs text-text-primary truncate flex-1">
                  {entry.path}
                </span>
                <span className={`text-xs ${statusColor(entry)}`}>
                  {entry.status === "pending" ? "..." : `${entry.durationMs}ms`}
                </span>
                {entry.statusCode && (
                  <span
                    className={`text-xs font-mono ${
                      entry.status === "ok" ? "text-sem-success" : "text-sem-error"
                    }`}
                  >
                    {entry.statusCode}
                  </span>
                )}
              </div>
            </button>
            {expanded === entry.id && (
              <div className="px-3 pb-2 space-y-1">
                {entry.reqBody !== undefined && (
                  <div>
                    <p className="text-xs text-text-caption mb-0.5">Request</p>
                    <pre className="text-xs bg-surface-card border border-border rounded p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(entry.reqBody, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.resBody !== undefined && (
                  <div>
                    <p className="text-xs text-text-caption mb-0.5">Response</p>
                    <pre className="text-xs bg-surface-card border border-border rounded p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(entry.resBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
