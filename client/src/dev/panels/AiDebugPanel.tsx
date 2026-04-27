// src/dev/panels/AiDebugPanel.tsx
import { useDevContext } from "../DevProvider";

export function AiDebugPanel() {
  const { logs } = useDevContext();
  // /ai/ 경로만 필터 — AI 엔드포인트는 promptVersion, 토큰 정보를 포함
  const aiLogs = logs.filter((l) => l.path.startsWith("/ai/"));

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-primary">
          AI 응답 디버거 ({aiLogs.length}건)
        </span>
      </div>
      <div className="overflow-y-auto flex-1">
        {aiLogs.length === 0 && (
          <p className="text-xs text-text-caption text-center py-6">
            AI API 호출 없음
          </p>
        )}
        {aiLogs.map((entry) => {
          const res = entry.resBody as Record<string, unknown> | undefined;
          return (
            <div
              key={entry.id}
              className="px-3 py-2 border-b border-border last:border-0 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${
                  entry.method === "GET"
                    ? "text-brand"
                    : entry.method === "POST"
                      ? "text-sem-warning"
                      : "text-text-secondary"
                }`}>
                  {entry.method}
                </span>
                <span className="font-mono text-xs text-text-primary">
                  {entry.path}
                </span>
                <span
                  className={`text-xs ml-auto ${
                    entry.status === "ok" ? "text-sem-success" : "text-sem-error"
                  }`}
                >
                  {entry.durationMs !== undefined
                    ? `${entry.durationMs}ms`
                    : "..."}
                </span>
              </div>
              {res && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {res.promptVersion !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">promptVersion</p>
                      <p className="font-mono text-text-primary">
                        {String(res.promptVersion)}
                      </p>
                    </div>
                  )}
                  {res.inputTokens !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">inputTokens</p>
                      <p className="font-mono text-text-primary">
                        {String(res.inputTokens)}
                      </p>
                    </div>
                  )}
                  {res.outputTokens !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">outputTokens</p>
                      <p className="font-mono text-text-primary">
                        {String(res.outputTokens)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
