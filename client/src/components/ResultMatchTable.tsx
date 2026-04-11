import { memo } from "react";

interface ResultMatchTableProps {
  /** JSON 배열 형태의 선택지 body 문자열 */
  readonly body: string;
}

/**
 * RESULT_MATCH 선택지용 컴팩트 결과 테이블.
 * body는 JSON 배열 문자열 ([{"COL":"VAL",...}]) — 파싱 후 테이블로 렌더링.
 * 실행 상태(성공/실패) 표시 없음 — 순수 데이터 테이블.
 */
export const ResultMatchTable = memo(function ResultMatchTable({ body }: ResultMatchTableProps) {
  // JSON 파싱 — 실패 시 raw body 텍스트 표시
  let rows: Record<string, unknown>[] = [];
  let parseError = false;

  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  if (parseError) {
    // 파싱 실패 시 원문 텍스트 표시 (CONCEPT_ONLY 텍스트 선택지 폴백)
    return <p className="text-body text-sm mt-2">{body}</p>;
  }

  // 빈 결과
  if (rows.length === 0) {
    return (
      <div className="mt-2 p-2 rounded" style={{ background: "var(--color-code-bg)" }}>
        <p className="text-caption text-sm text-center">(결과 없음)</p>
      </div>
    );
  }

  // 열 이름은 첫 번째 행의 키에서 추출
  const columns = Object.keys(rows[0]);

  return (
    <div className="mt-2 overflow-x-auto rounded" style={{ maxHeight: "200px", overflowY: "auto" }}>
      <table className="data-table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col}>{String(row[col] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
