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

/**
 * schemaDdl(CREATE TABLE 문)을 파싱하여 schemaDisplay 형식의 ParsedTable[]로 변환.
 * schemaDisplay가 없는 레거시 데이터의 폴백 용도.
 */
export function parseSchemaDdl(schemaDdl: string): ParsedTable[] {
  const results: ParsedTable[] = [];
  // CREATE TABLE 블록을 반복 추출
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+)\)/gi;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(schemaDdl)) !== null) {
    const tableName = tableMatch[1].toUpperCase();
    const body = tableMatch[2];
    const columns: ParsedColumn[] = [];
    // 컬럼 정의 라인 파싱 (PRIMARY KEY, FOREIGN KEY, CONSTRAINT 라인 제외)
    for (const line of body.split(",")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const upper = trimmed.toUpperCase();
      if (upper.startsWith("PRIMARY KEY") || upper.startsWith("FOREIGN KEY") || upper.startsWith("CONSTRAINT") || upper.startsWith("KEY") || upper.startsWith("INDEX")) continue;
      const tokens = trimmed.split(/\s+/);
      const name = tokens[0] ?? "";
      const type = tokens[1] ?? "";
      if (!name || name.startsWith("--")) continue;
      // PRIMARY KEY 인라인 표시 여부 확인
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
  readonly schemaIntent?: string;
}

export const SchemaViewer = memo(function SchemaViewer({
  schemaDisplay,
  schemaDdl,
  schemaSampleData,
  schemaIntent,
}: SchemaViewerProps) {
  const [ddlOpen, setDdlOpen] = useState(false);
  // schemaDisplay 없으면 schemaDdl을 파싱해서 폴백 (레거시 데이터 대응)
  const tables =
    schemaDisplay && schemaDisplay.trim()
      ? parseSchemaDisplay(schemaDisplay)
      : schemaDdl
        ? parseSchemaDdl(schemaDdl)
        : [];
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
