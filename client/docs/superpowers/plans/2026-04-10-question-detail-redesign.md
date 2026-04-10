# 문제 풀기 화면 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문제 풀기 화면에 스키마 시각화(SchemaViewer), 개선된 실행 결과 테이블(ResultTable), 자유 SQL 실행기(SqlPlayground), AnswerFeedback 재설계를 구현한다.

**Architecture:** 공용 `ResultTable` 컴포넌트를 먼저 만들어 ChoiceCard, SqlPlayground, AnswerFeedback이 재사용한다. `SchemaViewer`는 schemaDisplay 텍스트와 schemaSampleData INSERT문을 파싱해 테이블 카드 형태로 렌더링한다. AnswerFeedback은 `executionMode`에 따라 EXECUTABLE(실행 결과 비교)과 CONCEPT_ONLY(텍스트 비교)로 분기한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react, @tanstack/react-query

---

## File Map

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/types/api.ts` | SubmitResult 타입 확장 | 수정 |
| `src/components/ResultTable.tsx` | 실행 결과 테이블 공용 컴포넌트 | **신규** |
| `src/components/SchemaViewer.tsx` | 스키마 시각화 (테이블 카드 + 샘플 데이터) | **신규** |
| `src/components/SqlPlayground.tsx` | 자유 SQL 실행기 | **신규** |
| `src/components/ChoiceCard.tsx` | ResultTable 적용, 레이아웃 개선 | 수정 |
| `src/pages/QuestionDetail.tsx` | SchemaViewer, SqlPlayground 통합 | 수정 |
| `src/pages/AnswerFeedback.tsx` | EXECUTABLE/CONCEPT_ONLY 분기, 실행 결과 비교 | 수정 (전면 재설계) |
| `src/components/ResultTable.test.tsx` | ResultTable 유닛 테스트 | **신규** |
| `src/components/SchemaViewer.test.tsx` | SchemaViewer 파싱 로직 테스트 | **신규** |
| `src/components/SqlPlayground.test.tsx` | SqlPlayground 유닛 테스트 | **신규** |

---

## Task 1: SubmitResult 타입 확장

**Files:**
- Modify: `src/types/api.ts:58-62`

- [ ] **Step 1: SubmitResult에 선택적 실행 결과 필드 추가**

BE가 아직 미구현이므로 optional 필드로 추가한다. `executionMode`도 포함해 AnswerFeedback에서 분기할 수 있도록 한다.

현재 코드 (`src/types/api.ts:58-62`):
```typescript
export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
}
```

변경 후:
```typescript
export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult?: ExecuteResult;
  readonly correctResult?: ExecuteResult;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: SubmitResult에 executionMode, selectedResult, correctResult 선택적 필드 추가 #70"
```

---

## Task 2: ResultTable 공용 컴포넌트

실행 결과 테이블을 ChoiceCard, SqlPlayground, AnswerFeedback에서 공용으로 쓸 컴포넌트.

**Files:**
- Create: `src/components/ResultTable.tsx`
- Create: `src/components/ResultTable.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/ResultTable.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResultTable } from "./ResultTable";
import type { ExecuteResult } from "../types/api";

const successResult: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [["홍길동", 2], ["김영희", 3]],
  rowCount: 2,
  elapsedMs: 34,
  errorCode: null,
  errorMessage: null,
};

const errorResult: ExecuteResult = {
  status: "ERROR",
  columns: [],
  rows: [],
  rowCount: 0,
  elapsedMs: 0,
  errorCode: "UNKNOWN_COLUMN",
  errorMessage: "Unknown column 'o.cust_id'",
};

describe("ResultTable", () => {
  it("성공 결과: 행 수, 시간, 테이블 헤더/셀 렌더링", () => {
    render(<ResultTable result={successResult} />);
    expect(screen.getByText("2행 · 34ms")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("에러 결과: errorCode와 errorMessage 렌더링", () => {
    render(<ResultTable result={errorResult} />);
    expect(screen.getByText("UNKNOWN_COLUMN")).toBeInTheDocument();
    expect(screen.getByText("Unknown column 'o.cust_id'")).toBeInTheDocument();
  });

  it("컬럼이 없으면 테이블 미렌더링", () => {
    const noColResult = { ...successResult, columns: [], rows: [], rowCount: 0 };
    render(<ResultTable result={noColResult} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("onAskAi prop 있을 때 에러 카드에 AI 버튼 렌더링", () => {
    const mockFn = vi.fn();
    render(<ResultTable result={errorResult} onAskAi={mockFn} />);
    expect(screen.getByText("AI에게 물어보기")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
npm test src/components/ResultTable.test.tsx -- --run
```

Expected: FAIL (ResultTable not found)

- [ ] **Step 3: ResultTable 구현**

`src/components/ResultTable.tsx`:
```typescript
import { memo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import type { ExecuteResult } from "../types/api";

interface ResultTableProps {
  readonly result: ExecuteResult;
  readonly onAskAi?: () => void;
}

export const ResultTable = memo(function ResultTable({ result, onAskAi }: ResultTableProps) {
  if (result.errorCode) {
    return (
      <div className="error-card mt-3">
        <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
          <AlertTriangle size={14} className="inline mr-1" />
          {result.errorCode}
        </span>
        <p className="text-secondary mt-1 text-sm">{result.errorMessage}</p>
        {onAskAi && (
          <div className="flex justify-end mt-2">
            <button
              className="text-brand text-sm font-medium"
              type="button"
              onClick={onAskAi}
            >
              AI에게 물어보기
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="success-card mt-3">
      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-sem-success-text)" }}>
        <Check size={14} className="inline mr-1" />
        {result.rowCount}행 · {result.elapsedMs}ms
      </p>
      {result.columns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                {result.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {(row as unknown[]).map((cell, j) => (
                    <td key={j}>{String(cell ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm test src/components/ResultTable.test.tsx -- --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultTable.tsx src/components/ResultTable.test.tsx
git commit -m "feat: ResultTable 공용 컴포넌트 추가 #70"
```

---

## Task 3: SchemaViewer 컴포넌트

schemaDisplay 텍스트를 파싱해 테이블 카드로, schemaSampleData INSERT문을 파싱해 샘플 데이터 테이블로 렌더링.

**Files:**
- Create: `src/components/SchemaViewer.tsx`
- Create: `src/components/SchemaViewer.test.tsx`

**파싱 규칙:**

schemaDisplay 형식:
```
CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)
ORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)
```
→ 각 줄을 파싱: `(\w+)\s*\((.+)\)` → tableName, 컬럼 목록

컬럼 파싱: `col_name TYPE [PK|FK]` 형태로 split 후 constraint 추출

schemaSampleData 형식:
```
INSERT INTO CUSTOMER VALUES (1, '홍길동', 'hong@test.com');
INSERT INTO CUSTOMER VALUES (2, '김영희', 'kim@test.com');
INSERT INTO ORDERS VALUES (1, 1, 50000, '2026-01-01');
```
→ `INSERT INTO (\w+) VALUES\s*\((.+)\);` 정규식으로 tableName과 values 추출

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/SchemaViewer.test.tsx`:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SchemaViewer, parseSchemaDisplay, parseSampleData } from "./SchemaViewer";

const schemaDisplay = "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)";
const schemaSampleData = "INSERT INTO CUSTOMER VALUES (1, '홍길동', 'hong@test.com');\nINSERT INTO CUSTOMER VALUES (2, '김영희', 'kim@test.com');\nINSERT INTO ORDERS VALUES (1, 1, 50000, '2026-01-01');";
const schemaDdl = "CREATE TABLE CUSTOMER (id INT PRIMARY KEY);";

describe("parseSchemaDisplay", () => {
  it("테이블명과 컬럼 파싱", () => {
    const result = parseSchemaDisplay(schemaDisplay);
    expect(result).toHaveLength(2);
    expect(result[0].tableName).toBe("CUSTOMER");
    expect(result[0].columns).toHaveLength(3);
    expect(result[0].columns[0]).toEqual({ name: "id", type: "INT", constraint: "PK" });
    expect(result[0].columns[1]).toEqual({ name: "name", type: "VARCHAR", constraint: null });
  });

  it("FK 컬럼 파싱", () => {
    const result = parseSchemaDisplay(schemaDisplay);
    const fkCol = result[1].columns.find((c) => c.name === "customer_id");
    expect(fkCol?.constraint).toBe("FK");
  });

  it("빈 문자열 → 빈 배열", () => {
    expect(parseSchemaDisplay("")).toEqual([]);
  });
});

describe("parseSampleData", () => {
  it("INSERT문을 테이블별 행으로 파싱", () => {
    const result = parseSampleData(schemaSampleData);
    expect(result.get("CUSTOMER")).toHaveLength(2);
    expect(result.get("ORDERS")).toHaveLength(1);
  });

  it("CUSTOMER 첫 행 값 파싱", () => {
    const result = parseSampleData(schemaSampleData);
    expect(result.get("CUSTOMER")![0]).toEqual(["1", "홍길동", "hong@test.com"]);
  });
});

describe("SchemaViewer", () => {
  it("테이블 카드 헤더 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} />);
    expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
    expect(screen.getByText("ORDERS")).toBeInTheDocument();
  });

  it("컬럼 타입 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} />);
    expect(screen.getAllByText("INT").length).toBeGreaterThan(0);
    expect(screen.getByText("VARCHAR")).toBeInTheDocument();
  });

  it("DDL 접기 토글 동작", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} schemaDdl={schemaDdl} />);
    expect(screen.queryByText(schemaDdl)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("DDL 보기"));
    expect(screen.getByText(schemaDdl)).toBeInTheDocument();
  });

  it("샘플 데이터 테이블 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} schemaSampleData={schemaSampleData} />);
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("hong@test.com")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test src/components/SchemaViewer.test.tsx -- --run
```

Expected: FAIL (SchemaViewer not found)

- [ ] **Step 3: SchemaViewer 구현**

`src/components/SchemaViewer.tsx`:
```typescript
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
  const sampleRows = schemaSampleData ? parseSampleData(schemaSampleData) : new Map();

  return (
    <div className="mt-2 space-y-4">
      {schemaIntent && (
        <p className="text-sm text-text-secondary">{schemaIntent}</p>
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
                  <tr key={col.name} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono font-medium text-body w-2/5">
                      {col.constraint === "PK" && (
                        <Key size={12} className="inline mr-1 text-brand" />
                      )}
                      {col.constraint === "FK" && (
                        <Link size={12} className="inline mr-1 text-text-secondary" />
                      )}
                      {col.name}
                    </td>
                    <td className="px-4 py-2 text-text-secondary w-2/5">{col.type}</td>
                    <td className="px-4 py-2 text-text-caption text-xs w-1/5">
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
                <p className="text-xs text-text-caption mb-1">{table.tableName} 샘플 데이터</p>
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
            className="flex items-center gap-1 text-xs text-text-secondary"
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
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm test src/components/SchemaViewer.test.tsx -- --run
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/SchemaViewer.tsx src/components/SchemaViewer.test.tsx
git commit -m "feat: SchemaViewer 컴포넌트 추가 (스키마 시각화, 샘플 데이터 파싱) #70"
```

---

## Task 4: ChoiceCard 개선 (ResultTable 적용)

기존 인라인 테이블 코드를 ResultTable 공용 컴포넌트로 교체. 실행 버튼 위치와 레이아웃 개선.

**Files:**
- Modify: `src/components/ChoiceCard.tsx`
- Modify: `src/components/ChoiceCard.test.tsx` (기존 테스트 확인)

- [ ] **Step 1: 기존 ChoiceCard 테스트 실행 → 현재 상태 확인**

```bash
npm test src/components/ChoiceCard.test.tsx -- --run
```

기존 테스트가 모두 통과하는지 확인.

- [ ] **Step 2: ChoiceCard 수정 (ResultTable 교체)**

`src/components/ChoiceCard.tsx` 전체 교체:
```typescript
import { memo } from "react";
import type { ChoiceItem, ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";

interface ChoiceCardProps {
  readonly choice: ChoiceItem;
  readonly isSelected: boolean;
  readonly cached: ExecuteResult | undefined;
  readonly isExecutable: boolean;
  readonly isExecuting: boolean;
  readonly onSelect: (key: string, sql: string) => void;
  readonly onExecute: (key: string, sql: string) => void;
  readonly onAskAi?: (choiceKey: string, errorCode: string, errorMessage: string) => void;
}

export const ChoiceCard = memo(function ChoiceCard({
  choice,
  isSelected,
  cached,
  isExecutable,
  isExecuting,
  onSelect,
  onExecute,
  onAskAi,
}: ChoiceCardProps) {
  const borderClass = isSelected ? "border-brand border-2" : "border-border";

  return (
    <div className={`card-base ${borderClass}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={`radio-custom mt-0.5 shrink-0 ${isSelected ? "radio-custom--selected" : ""}`}
          onClick={() => onSelect(choice.key, choice.body)}
          aria-label={`선택지 ${choice.key}`}
        />
        <div className="flex-1 min-w-0">
          <span className="text-body font-bold text-sm mb-2 block">{choice.key}</span>
          <pre className="code-block text-sm"><code>{choice.body}</code></pre>
          {isExecutable && (
            <div className="flex justify-end mt-2">
              <button
                className="btn-compact"
                type="button"
                onClick={() => onExecute(choice.key, choice.body)}
                disabled={!!cached || isExecuting}
              >
                {isExecuting ? "실행 중..." : "실행"}
              </button>
            </div>
          )}
          {cached && (
            <ResultTable
              result={cached}
              onAskAi={
                cached.errorCode
                  ? () => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 3: 테스트 실행 → 통과 확인**

```bash
npm test src/components/ChoiceCard.test.tsx -- --run
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ChoiceCard.tsx
git commit -m "refactor: ChoiceCard에 ResultTable 컴포넌트 적용 #70"
```

---

## Task 5: SqlPlayground 컴포넌트

자유 SQL 입력 + 실행 + 결과 표시. 모바일은 바텀시트, 데스크톱은 하단 패널.

**Files:**
- Create: `src/components/SqlPlayground.tsx`
- Create: `src/components/SqlPlayground.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/SqlPlayground.test.tsx`:
```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SqlPlayground } from "./SqlPlayground";
import type { ExecuteResult } from "../types/api";

const mockExecute = vi.fn();
const successResult: ExecuteResult = {
  status: "SUCCESS",
  columns: ["id", "name"],
  rows: [[1, "홍길동"]],
  rowCount: 1,
  elapsedMs: 12,
  errorCode: null,
  errorMessage: null,
};

describe("SqlPlayground", () => {
  it("SQL textarea가 렌더링됨", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
  });

  it("실행 버튼 클릭 시 onExecute 호출", async () => {
    mockExecute.mockResolvedValue(successResult);
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.change(screen.getByPlaceholderText(/SELECT/i), {
      target: { value: "SELECT * FROM CUSTOMER" },
    });
    fireEvent.click(screen.getByText("실행"));
    await waitFor(() => expect(mockExecute).toHaveBeenCalledWith("SELECT * FROM CUSTOMER"));
  });

  it("SQL이 비어있으면 실행 버튼 비활성화", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    expect(screen.getByText("실행")).toBeDisabled();
  });

  it("실행 결과 렌더링", async () => {
    mockExecute.mockResolvedValue(successResult);
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.change(screen.getByPlaceholderText(/SELECT/i), {
      target: { value: "SELECT * FROM CUSTOMER" },
    });
    fireEvent.click(screen.getByText("실행"));
    await waitFor(() => expect(screen.getByText("홍길동")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npm test src/components/SqlPlayground.test.tsx -- --run
```

Expected: FAIL

- [ ] **Step 3: SqlPlayground 구현**

`src/components/SqlPlayground.tsx`:
```typescript
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
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npm test src/components/SqlPlayground.test.tsx -- --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/SqlPlayground.tsx src/components/SqlPlayground.test.tsx
git commit -m "feat: SqlPlayground 자유 SQL 실행기 컴포넌트 추가 #70"
```

---

## Task 6: QuestionDetail에 SchemaViewer + SqlPlayground 통합

기존 raw text 스키마 섹션을 SchemaViewer로 교체하고, 하단에 SqlPlayground 추가.

**Files:**
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: import 추가 및 schemaSection 교체**

`src/pages/QuestionDetail.tsx` 상단 import에 추가:
```typescript
import { SchemaViewer } from "../components/SchemaViewer";
import { SqlPlayground } from "../components/SqlPlayground";
import { executeChoice } from "../api/questions";
```

- [ ] **Step 2: schemaSection 변수 교체**

`QuestionDetail.tsx`의 `schemaSection` (현재 126-167줄) 교체:

기존 코드:
```typescript
  const schemaSection = question.schemaDisplay ? (
    <section className="mt-3">
      <button
        type="button"
        className="flex items-center gap-2 text-secondary text-sm w-full"
        onClick={() => setSchemaOpen((prev) => !prev)}
      >
        <span>스키마 보기</span>
        {schemaOpen ? (
          <ChevronUp size={16} className="text-text-caption" />
        ) : (
          <ChevronDown size={16} className="text-text-caption" />
        )}
      </button>
      {schemaOpen && (
        <div className="mt-2 space-y-3">
          {question.schemaIntent && (
            <p className="text-sm text-text-secondary">{question.schemaIntent}</p>
          )}
          <pre className="code-block">
            <code>{question.schemaDisplay}</code>
          </pre>
          {question.schemaDdl && (
            <div>
              <p className="text-xs text-text-caption mb-1">DDL</p>
              <pre className="code-block">
                <code>{question.schemaDdl}</code>
              </pre>
            </div>
          )}
          {question.schemaSampleData && (
            <div>
              <p className="text-xs text-text-caption mb-1">샘플 데이터</p>
              <pre className="code-block">
                <code>{question.schemaSampleData}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  ) : null;
```

변경 후:
```typescript
  const schemaSection = question.schemaDisplay ? (
    <section className="mt-3">
      <button
        type="button"
        className="flex items-center gap-2 text-secondary text-sm w-full"
        onClick={() => setSchemaOpen((prev) => !prev)}
      >
        <span>스키마 보기</span>
        {schemaOpen ? (
          <ChevronUp size={16} className="text-text-caption" />
        ) : (
          <ChevronDown size={16} className="text-text-caption" />
        )}
      </button>
      {schemaOpen && (
        <SchemaViewer
          schemaDisplay={question.schemaDisplay}
          schemaDdl={question.schemaDdl}
          schemaSampleData={question.schemaSampleData}
          schemaIntent={question.schemaIntent}
        />
      )}
    </section>
  ) : null;
```

- [ ] **Step 3: SqlPlayground을 스크롤 영역 하단에 추가**

`QuestionDetail.tsx`의 `choicesSection` 아래, 제출 버튼 위에 SqlPlayground 추가:

현재 JSX 반환 부분의 `{/* 스크롤: 선택지 */}` 섹션:
```tsx
      {/* 스크롤: 선택지 */}
      <div className="flex-1 overflow-y-auto px-1">
        {choicesSection}
      </div>
```

변경 후:
```tsx
      {/* 스크롤: 선택지 + SQL 실행기 */}
      <div className="flex-1 overflow-y-auto px-1">
        {choicesSection}
        {question.executionMode === "EXECUTABLE" && (
          <SqlPlayground
            questionUuid={questionUuid!}
            onExecute={(sql) => executeChoice(questionUuid!, sql)}
          />
        )}
      </div>
```

- [ ] **Step 4: 불필요해진 import 정리**

QuestionDetail.tsx 상단에서 더 이상 직접 사용하지 않는 `ChevronUp`, `ChevronDown`이 schemaSection에서 여전히 사용되므로 유지한다. `BookOpen`은 stemOpen 토글에서 사용 중이므로 유지.

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```

Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add src/pages/QuestionDetail.tsx
git commit -m "feat: QuestionDetail에 SchemaViewer, SqlPlayground 통합 #70"
```

---

## Task 7: AnswerFeedback 전면 재설계

EXECUTABLE 문제는 실행 결과 비교 + 텍스트 해설, CONCEPT_ONLY는 선택지 텍스트 비교만. `executionMode`와 `selectedResult`, `correctResult`를 navigate state로 받아 분기.

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`
- Modify: `src/pages/QuestionDetail.tsx` (navigate state에 executionMode 추가)

- [ ] **Step 1: QuestionDetail navigate state에 executionMode 추가**

`src/pages/QuestionDetail.tsx`의 `handleSubmit` 내 navigate 호출 (현재 80-89줄):

기존:
```typescript
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionUuid,
          },
        });
```

변경 후:
```typescript
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionUuid,
            executionMode: question.executionMode,
          },
        });
```

- [ ] **Step 2: AnswerFeedback FeedbackState 인터페이스 확장**

`src/pages/AnswerFeedback.tsx`의 `FeedbackState`:

기존:
```typescript
interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
}
```

변경 후:
```typescript
import type { ExecuteResult, ExecutionMode } from "../types/api";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult?: ExecuteResult;
  readonly correctResult?: ExecuteResult;
}
```

- [ ] **Step 3: AnswerFeedback 전면 재설계**

`src/pages/AnswerFeedback.tsx` 전체 교체:
```typescript
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { ResultTable } from "../components/ResultTable";
import { useSimilarQuestions } from "../hooks/useSimilarQuestions";
import type { ExecuteResult, ExecutionMode } from "../types/api";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult?: ExecuteResult;
  readonly correctResult?: ExecuteResult;
}

function SqlCompareBlock({
  label,
  choiceKey,
  sql,
  result,
  isCorrect,
}: {
  label: string;
  choiceKey: string;
  sql?: string;
  result?: ExecuteResult;
  isCorrect: boolean;
}) {
  const borderColor = isCorrect
    ? "var(--color-sem-success)"
    : "var(--color-sem-error)";
  const bgColor = isCorrect
    ? "var(--color-sem-success-light)"
    : "var(--color-sem-error-light)";
  const badgeBg = isCorrect ? "#DCFCE7" : "#FEE2E2";
  const badgeColor = isCorrect
    ? "var(--color-sem-success-text)"
    : "var(--color-sem-error-text)";

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{ backgroundColor: bgColor, borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span
          className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
          style={{ backgroundColor: badgeBg, color: badgeColor }}
        >
          {choiceKey}
        </span>
      </div>
      {sql && (
        <pre className="text-sm font-mono leading-relaxed">
          <code>{sql}</code>
        </pre>
      )}
      {result && <ResultTable result={result} />}
    </div>
  );
}

function TextCompareBlock({
  label,
  choiceKey,
  body,
  isCorrect,
}: {
  label: string;
  choiceKey: string;
  body?: string;
  isCorrect: boolean;
}) {
  const borderColor = isCorrect
    ? "var(--color-sem-success)"
    : "var(--color-sem-error)";
  const bgColor = isCorrect
    ? "var(--color-sem-success-light)"
    : "var(--color-sem-error-light)";
  const badgeBg = isCorrect ? "#DCFCE7" : "#FEE2E2";
  const badgeColor = isCorrect
    ? "var(--color-sem-success-text)"
    : "var(--color-sem-error-text)";

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{ backgroundColor: bgColor, borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span
          className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
          style={{ backgroundColor: badgeBg, color: badgeColor }}
        >
          {choiceKey}
        </span>
      </div>
      {body && <p className="text-body text-sm">{body}</p>}
    </div>
  );
}

export default function AnswerFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FeedbackState | null;

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const diffMutation = useMutation({
    mutationFn: diffExplain,
    onSuccess: (result) => setAiText(result.text),
  });
  const similarQuery = useSimilarQuestions(state?.questionUuid ?? "");

  const handleAskAi = () => {
    if (!state) return;
    setAiSheetOpen(true);
    setAiText("");
    diffMutation.mutate({
      questionUuid: state.questionUuid,
      selectedChoiceKey: state.selectedKey,
    });
  };

  if (!state) {
    navigate("/questions", { replace: true });
    return null;
  }

  const {
    isCorrect,
    correctKey,
    rationale,
    selectedKey,
    selectedSql,
    correctSql,
    executionMode,
    selectedResult,
    correctResult,
  } = state;

  const isExecutable = executionMode === "EXECUTABLE";

  const headerSection = (
    <div className="text-center pt-12 pb-8">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: isCorrect ? "#DCFCE7" : "#FEE2E2" }}
      >
        {isCorrect ? (
          <Check size={36} style={{ color: "var(--color-sem-success-text)" }} />
        ) : (
          <X size={36} style={{ color: "var(--color-sem-error-text)" }} />
        )}
      </div>
      <h1
        className="text-2xl font-bold"
        style={{
          color: isCorrect
            ? "var(--color-sem-success-text)"
            : "var(--color-sem-error-text)",
        }}
      >
        {isCorrect ? "정답입니다!" : "오답이에요"}
      </h1>
      <p className="text-secondary mt-2">
        {isCorrect
          ? "정확히 맞혔어요! 다음 문제도 도전해보세요"
          : `정답은 ${correctKey}예요. 해설을 확인해보세요`}
      </p>
    </div>
  );

  const comparisonSection = isExecutable ? (
    <div className="card-base">
      {!isCorrect && (
        <SqlCompareBlock
          label="내가 선택한 SQL"
          choiceKey={selectedKey}
          sql={selectedSql}
          result={selectedResult}
          isCorrect={false}
        />
      )}
      <SqlCompareBlock
        label={isCorrect ? "정답 SQL" : "정답 SQL"}
        choiceKey={correctKey}
        sql={correctSql}
        result={correctResult}
        isCorrect={true}
      />
      <div className="mt-4">
        <p className="text-secondary text-sm mb-2">해설</p>
        <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
          {rationale}
        </p>
      </div>
      {!isCorrect && (
        <button className="btn-primary w-full mt-4" type="button" onClick={handleAskAi}>
          AI에게 자세히 물어보기
        </button>
      )}
    </div>
  ) : (
    <div className="card-base">
      {!isCorrect && (
        <TextCompareBlock
          label="내가 선택한 답"
          choiceKey={selectedKey}
          body={selectedSql}
          isCorrect={false}
        />
      )}
      <TextCompareBlock
        label="정답"
        choiceKey={correctKey}
        body={correctSql}
        isCorrect={true}
      />
      <div className="mt-4">
        <p className="text-secondary text-sm mb-2">해설</p>
        <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
          {rationale}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-180 w-full px-4 pb-24">
        {headerSection}
        {comparisonSection}
        {similarQuery.data && similarQuery.data.length > 0 && (
          <section className="mt-6">
            <h2 className="text-secondary text-sm mb-3">유사 문제</h2>
            <div className="space-y-2">
              {similarQuery.data.map((q) => (
                <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`}>
                  <div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-body truncate">{q.stem}</p>
                      <span className="badge-topic">{q.topicName}</span>
                    </div>
                    <ChevronRight size={16} className="text-text-caption flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={diffMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      <div
        className="fixed bottom-0 inset-x-0 p-4 z-20"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
        }}
      >
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className="w-full h-[52px] rounded-lg text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => navigate("/questions")}
          >
            다음 문제
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -30
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/pages/AnswerFeedback.tsx src/pages/QuestionDetail.tsx
git commit -m "feat: AnswerFeedback 전면 재설계 (EXECUTABLE/CONCEPT_ONLY 분기, 실행 결과 비교) #70"
```

---

## Task 8: 전체 테스트 + 최종 빌드

- [ ] **Step 1: 전체 테스트 실행**

```bash
npm test -- --run
```

Expected: 모든 테스트 PASS

- [ ] **Step 2: 프로덕션 빌드**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 3: 커버리지 확인**

```bash
npm run test -- --coverage --run 2>&1 | grep -E "(All files|ResultTable|SchemaViewer|SqlPlayground)"
```

신규 컴포넌트 3개 커버리지 80% 이상 확인.

- [ ] **Step 4: 최종 커밋 (필요 시)**

변경 사항이 있으면:
```bash
git add -p
git commit -m "fix: 빌드 및 테스트 수정 #70"
```

---

## 구현 의존성 정리

```
Task 1 (타입)
    ↓
Task 2 (ResultTable)    Task 3 (SchemaViewer)
    ↓                         ↓
Task 4 (ChoiceCard)    Task 5 (SqlPlayground)
    ↓                         ↓
    └─────── Task 6 (QuestionDetail) ───────┘
                       ↓
               Task 7 (AnswerFeedback)
                       ↓
               Task 8 (검증)
```

Task 1, 3은 병렬 가능. Task 2, 5도 병렬 가능.

## Phase 3 (AnswerFeedback 실행 결과) 대기 상태

BE가 SubmitResult에 `selectedResult`, `correctResult`를 추가하기 전까지:
- `selectedResult`, `correctResult`가 `undefined`이면 ResultTable이 렌더링되지 않음
- SQL 코드 비교 + 텍스트 해설은 현재도 동작
- BE 업데이트 후 자동으로 실행 결과가 표시됨 (코드 변경 불필요)
