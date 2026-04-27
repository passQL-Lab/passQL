/** HTTP 메서드별 색상 배지 — ApiLogPanel, AiDebugPanel 공용 */
export function MethodBadge({ method }: { readonly method: string }) {
  const color =
    method === "GET"
      ? "text-brand"
      : method === "POST"
        ? "text-sem-warning"
        : "text-text-secondary";
  return <span className={`font-mono text-xs font-bold ${color}`}>{method}</span>;
}
