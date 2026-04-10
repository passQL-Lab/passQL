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
  return schemaDisplay
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\w+)\s*\((.+)\)$/);
      if (!match) return null;
      const [, tableName, colsStr] = match;
      const columns = colsStr.split(",").map((part) => {
        const tokens = part.trim().split(/\s+/);
        const name = tokens[0] ?? "";
        const type = tokens[1] ?? "";
        const constraintToken = tokens[2]?.toUpperCase() ?? "";
        const constraint: "PK" | "FK" | null =
          constraintToken === "PK" ? "PK" : constraintToken === "FK" ? "FK" : null;
        return { name, type, constraint };
      });
      return { tableName, columns };
    })
    .filter((t): t is ParsedTable => t !== null);
}

export function parseSampleData(schemaSampleData: string): Map<string, string[][]> {
  const result = new Map<string, string[][]>();
  const insertRegex = /INSERT INTO\s+(\w+)\s+VALUES\s*\((.+?)\)\s*;/gi;
  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(schemaSampleData)) !== null) {
    const tableName = match[1].toUpperCase();
    const valuesStr = match[2];
    const values = valuesStr.split(",").map((v) =>
      v.trim().replace(/^'(.*)'$/, "$1")
    );
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
  const sampleRows = schemaSampleData ? parseSampleData(schemaSampleData) : new Map<string, string[][]>();

  return (
    <div className="mt-2 space-y-4">
      {schemaIntent && (
        <p className="text-sm" style={{ color: "var(--color-text-body)" }}>{schemaIntent}</p>
      )}

      {/* 테이블 구조 카드 */}
      <div className="space-y-3">
        {tables.map((table) => (
          <div key={table.tableName} className="card-base p-0 overflow-hidden">
            <div
              className="px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-accent-light)",
                color: "var(--color-brand)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {table.tableName}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {table.columns.map((col) => (
                  <tr
                    key={col.name}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0"
                  >
                    <td className="px-4 py-2 font-mono font-medium w-2/5" style={{ color: "var(--color-text-body)" }}>
                      {col.constraint === "PK" && (
                        <Key size={12} className="inline mr-1" style={{ color: "var(--color-brand)" }} />
                      )}
                      {col.constraint === "FK" && (
                        <Link size={12} className="inline mr-1" style={{ color: "var(--color-text-body)" }} />
                      )}
                      {col.name}
                    </td>
                    <td className="px-4 py-2 w-2/5" style={{ color: "var(--color-text-body)" }}>{col.type}</td>
                    <td className="px-4 py-2 text-xs w-1/5" style={{ color: "var(--color-text-body)", opacity: 0.6 }}>
                      {col.constraint ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 샘플 데이터 테이블 */}
      {sampleRows.size > 0 && (
        <div className="space-y-3">
          {tables.map((table) => {
            const rows = sampleRows.get(table.tableName.toUpperCase()) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={`sample-${table.tableName}`}>
                <p className="text-xs mb-1" style={{ color: "var(--color-text-body)", opacity: 0.6 }}>
                  {table.tableName} 샘플 데이터
                </p>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
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
        </div>
      )}

      {/* DDL 접기/펼치기 */}
      {schemaDdl && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--color-text-body)", opacity: 0.7 }}
            onClick={() => setDdlOpen((prev) => !prev)}
          >
            DDL 보기
            {ddlOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {ddlOpen && (
            <pre className="code-block mt-2 text-xs">
              <code>{schemaDdl}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
});
