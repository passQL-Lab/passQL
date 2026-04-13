import { memo, useState } from "react";
import { ChevronDown, ChevronUp, Table2 } from "lucide-react";

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
  // VALUES 이후 세미콜론까지 전체를 캡처 — 다중 행 INSERT (1),(2),(3) 형식 지원
  const insertRegex = /INSERT INTO\s+(\w+)\s+VALUES\s*(.+?)\s*;/gi;
  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(schemaSampleData)) !== null) {
    const tableName = match[1].toUpperCase();
    const allValuesStr = match[2];

    // (v1, v2, ...) 단위로 각 행을 분리 — (1),(2,'홍길동') 등 다양한 형식 처리
    const rowRegex = /\(([^)]*)\)/g;
    let rowMatch: RegExpExecArray | null;
    const existingRows = result.get(tableName) ?? [];
    const newRows: string[][] = [];
    while ((rowMatch = rowRegex.exec(allValuesStr)) !== null) {
      const cells = rowMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/^'(.*)'$/s, "$1"));
      newRows.push(cells);
    }
    result.set(tableName, [...existingRows, ...newRows]);
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
  const [open, setOpen] = useState(true);

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
        className="flex items-center gap-1 text-xs font-medium mb-1 text-text-caption"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        스키마 {open ? "접기" : "보기"}
      </button>

      {!open ? null : (
        <div className="space-y-3">
          {tables.map((table) => {
            const rows = sampleRows.get(table.tableName.toUpperCase()) ?? [];
            const hasSample = rows.length > 0;

            return (
              <div key={table.tableName} className="space-y-2">
                {/* 스키마 구조 카드 */}
                <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
                  {/* 테이블 헤더 — 아이콘 + 테이블명 */}
                  <div className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold font-mono bg-accent-light text-brand border-b border-border">
                    <Table2 size={14} />
                    {table.tableName}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-sm whitespace-nowrap w-full border-collapse">
                      <tbody>
                        {table.columns.map((col, idx) => (
                          <tr
                            key={col.name}
                            className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-surface-page" : ""}`}
                          >
                            {/* 컬럼명(제약조건) 형태로 표현 — ID(PK), DEPT_ID(FK) */}
                            <td className="px-2 py-0.5 font-mono font-medium text-body">
                              {col.name}
                              {col.constraint && (
                                <span className="ml-0.5 text-xs text-brand opacity-80">
                                  ({col.constraint})
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-0.5 text-text-caption">
                              {col.type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 샘플 데이터 카드 — space-y-2 간격으로 분리 */}
                {hasSample && (
                  <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="text-sm whitespace-nowrap w-full border-collapse">
                        <thead>
                          <tr className="bg-surface-page">
                            {table.columns.map((col) => (
                              <th
                                key={col.name}
                                className="px-2 py-0.5 text-left font-medium font-mono text-text-caption border-b border-border"
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
                              className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-surface-page" : ""}`}
                            >
                              {row.map((cell, j) => (
                                <td key={j} className="px-2 py-0.5 font-mono tabular-nums text-body">
                                  {cell}
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
          })}
        </div>
      )}
    </div>
  );
});
