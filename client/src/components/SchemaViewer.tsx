import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ParsedColumn {
  readonly name: string;
  readonly type: string;
  readonly constraint: "PK" | "FK" | null;
}

interface ParsedTable {
  readonly tableName: string;
  readonly columns: readonly ParsedColumn[];
}

export function parseSchemaDisplay(schemaDisplay: string): ParsedTable[] {
  if (!schemaDisplay.trim()) return [];
  const results: ParsedTable[] = [];
  for (const line of schemaDisplay
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)) {
    const match = line.match(/^(\w+)\s*\((.+)\)$/);
    if (!match) continue;
    const [, tableName, colsStr] = match;
    const columns: ParsedColumn[] = colsStr.split(",").map((part) => {
      const tokens = part.trim().split(/\s+/);
      const name = tokens[0] ?? "";
      const type = tokens[1] ?? "";
      const constraintToken = tokens[2]?.toUpperCase() ?? "";
      const constraint: "PK" | "FK" | null =
        constraintToken === "PK"
          ? "PK"
          : constraintToken === "FK"
            ? "FK"
            : null;
      return { name, type, constraint };
    });
    results.push({ tableName, columns });
  }
  return results;
}

/**
 * schemaDdl(CREATE TABLE 문)을 파싱하여 schemaDisplay 형식의 ParsedTable[]로 변환.
 * schemaDisplay가 없는 레거시 데이터의 폴백 용도.
 */
export function parseSchemaDdl(schemaDdl: string): ParsedTable[] {
  const results: ParsedTable[] = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+)\)/gi;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(schemaDdl)) !== null) {
    const tableName = tableMatch[1].toUpperCase();
    const body = tableMatch[2];
    const columns: ParsedColumn[] = [];
    for (const line of body.split(",")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const upper = trimmed.toUpperCase();
      if (upper.startsWith("PRIMARY KEY") || upper.startsWith("FOREIGN KEY") || upper.startsWith("CONSTRAINT") || upper.startsWith("KEY") || upper.startsWith("INDEX")) continue;
      const tokens = trimmed.split(/\s+/);
      const name = tokens[0] ?? "";
      const type = tokens[1] ?? "";
      if (!name || name.startsWith("--")) continue;
      const isPk = upper.includes("PRIMARY KEY");
      columns.push({ name: name.toUpperCase(), type: type.toUpperCase(), constraint: isPk ? "PK" : null });
    }
    if (columns.length > 0) {
      results.push({ tableName, columns });
    }
  }
  return results;
}

export function parseSampleData(
  schemaSampleData: string,
): Map<string, string[][]> {
  const result = new Map<string, string[][]>();
  const insertRegex = /INSERT INTO\s+(\w+)\s+VALUES\s*\((.+?)\)\s*;/gi;
  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(schemaSampleData)) !== null) {
    const tableName = match[1].toUpperCase();
    const valuesStr = match[2];
    const values = valuesStr
      .split(",")
      .map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
    const rows = result.get(tableName) ?? [];
    result.set(tableName, [...rows, values]);
  }
  return result;
}

interface SchemaViewerProps {
  readonly schemaDisplay: string | null | undefined;
  readonly schemaDdl?: string | null;
  readonly schemaSampleData?: string;
  // schemaIntent는 UI에 노출하지 않음 — DB 설계자용 메모
}

export const SchemaViewer = memo(function SchemaViewer({
  schemaDisplay,
  schemaDdl,
  schemaSampleData,
}: SchemaViewerProps) {
  const [open, setOpen] = useState(false);

  const tables =
    schemaDisplay && schemaDisplay.trim()
      ? parseSchemaDisplay(schemaDisplay)
      : schemaDdl
        ? parseSchemaDdl(schemaDdl)
        : [];
  const sampleRows = schemaSampleData
    ? parseSampleData(schemaSampleData)
    : new Map<string, string[][]>();

  if (tables.length === 0) return null;

  return (
    <div className="mt-2">
      {/* 스키마 토글 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs font-medium mb-1"
        style={{ color: "var(--color-text-caption)" }}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        스키마 {open ? "접기" : "보기"}
      </button>

      {!open ? null : (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory" }}>
      {tables.map((table) => {
        const rows = sampleRows.get(table.tableName.toUpperCase()) ?? [];
        const hasSample = rows.length > 0;

        return (
          <div key={table.tableName} className="w-full min-w-0 space-y-2" style={{ scrollSnapAlign: "start" }}>
            {/* 스키마 구조 카드 */}
            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div
                className="px-2 py-0.5 text-sm font-bold font-mono"
                style={{
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-brand)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {table.tableName}
              </div>
              <table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {table.columns.map((col, idx) => (
                    <tr
                      key={col.name}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor: idx % 2 === 1 ? "var(--color-surface-page)" : undefined,
                      }}
                      className="last:border-0"
                    >
                      {/* 컬럼명(제약조건) 형태로 표현 — ID(PK), DEPT_ID(FK) */}
                      <td className="px-2 py-0.5 font-mono font-medium" style={{ color: "var(--color-text-body)" }}>
                        {col.name}
                        {col.constraint && (
                          <span className="ml-0.5 text-xs" style={{ color: "var(--color-brand)", opacity: 0.8 }}>
                            ({col.constraint})
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-0.5" style={{ color: "var(--color-text-caption)" }}>
                        {col.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 샘플 데이터 카드 — 4px(space-y-1) 간격으로 분리 */}
            {hasSample && (
              <div
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--color-border)" }}
              >
                <table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-surface-page)" }}>
                      {table.columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-2 py-0.5 text-left font-medium font-mono"
                          style={{ color: "var(--color-text-caption)", borderBottom: "1px solid var(--color-border)" }}
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="last:border-0"
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          backgroundColor: i % 2 === 1 ? "var(--color-surface-page)" : undefined,
                        }}
                      >
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-0.5 font-mono tabular-nums" style={{ color: "var(--color-text-body)" }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
      )}
    </div>
  );
});
