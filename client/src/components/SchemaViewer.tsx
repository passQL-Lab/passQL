import { useState, memo } from "react";
import { Key, Link, ChevronDown, ChevronUp } from "lucide-react";

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
  readonly schemaDisplay: string;
  readonly schemaDdl?: string;
  readonly schemaSampleData?: string;
  readonly schemaIntent?: string;
}

export const SchemaViewer = memo(function SchemaViewer({
  schemaDisplay,
  schemaDdl,
  schemaSampleData,
  schemaIntent,
}: SchemaViewerProps) {
  const [ddlOpen, setDdlOpen] = useState(false);
  const tables = parseSchemaDisplay(schemaDisplay);
  const sampleRows = schemaSampleData
    ? parseSampleData(schemaSampleData)
    : new Map<string, string[][]>();

  return (
    <div className="mt-1 space-y-2">
      {schemaIntent && (
        <p className="text-xs" style={{ color: "var(--color-text-caption)" }}>
          {schemaIntent}
        </p>
      )}

      {/* 테이블 구조 카드 — 가로 스와이프 */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {tables.map((table) => (
          <div
            key={table.tableName}
            className="card-base overflow-hidden shrink-0"
            style={{ padding: 8, scrollSnapAlign: "start" }}
          >
            <div
              className="px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: "var(--color-accent-light)",
                color: "var(--color-brand)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {table.tableName}
            </div>
            <table className="text-xs whitespace-nowrap">
              <tbody>
                {table.columns.map((col) => (
                  <tr
                    key={col.name}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0"
                  >
                    <td
                      className="px-3 py-1 font-mono font-medium w-2/5"
                      style={{ color: "var(--color-text-body)" }}
                    >
                      {col.constraint === "PK" && (
                        <Key
                          size={10}
                          className="inline mr-1"
                          style={{ color: "var(--color-brand)" }}
                        />
                      )}
                      {col.constraint === "FK" && (
                        <Link
                          size={10}
                          className="inline mr-1"
                          style={{ color: "var(--color-text-body)" }}
                        />
                      )}
                      {col.name}
                    </td>
                    <td
                      className="px-3 py-1 w-2/5"
                      style={{ color: "var(--color-text-caption)" }}
                    >
                      {col.type}
                    </td>
                    <td
                      className="px-3 py-1 w-1/5"
                      style={{ color: "var(--color-brand)", opacity: 0.7 }}
                    >
                      {col.constraint ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 샘플 데이터 + DDL — 접기/펼치기로 숨김 */}
      {(sampleRows.size > 0 || schemaDdl) && (
        <div className="space-y-2">
          {sampleRows.size > 0 &&
            tables.map((table) => {
              const rows = sampleRows.get(table.tableName.toUpperCase()) ?? [];
              if (rows.length === 0) return null;
              return (
                <div key={`sample-${table.tableName}`}>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--color-text-caption)" }}
                  >
                    {table.tableName} 샘플
                  </p>
                  <div className="overflow-x-auto">
                    <table className="data-table w-full text-xs">
                      <thead>
                        <tr>
                          {table.columns.map((col) => (
                            <th key={col.name}>{col.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

          {schemaDdl && (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--color-text-caption)" }}
                onClick={() => setDdlOpen((prev) => !prev)}
              >
                DDL{" "}
                {ddlOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {ddlOpen && (
                <pre className="code-block mt-1 text-xs">
                  <code>{schemaDdl}</code>
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
