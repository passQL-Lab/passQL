import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Mock Data ──
const MOCK = {
  id: 1,
  topic: "JOIN",
  difficulty: 2,
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schema: `CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)
ORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)`,
  choices: [
    {
      key: "A",
      sql: `SELECT c.name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY c.name`,
      status: "success" as const,
      result: {
        rows: 3,
        ms: 34,
        columns: ["name", "cnt"],
        data: [
          ["홍길동", "2"],
          ["김영희", "3"],
          ["이철수", "1"],
        ],
      },
    },
    {
      key: "B",
      sql: `SELECT c.name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.cust_id
GROUP BY c.name`,
      status: "error" as const,
      error: {
        code: "SQL_SYNTAX",
        message: "Unknown column 'o.cust_id' in 'on clause'",
      },
    },
    {
      key: "C",
      sql: `SELECT name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY name`,
      status: "idle" as const,
    },
    {
      key: "D",
      sql: `SELECT c.name, SUM(o.amount) AS total
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY c.name`,
      status: "idle" as const,
    },
  ],
} as const;

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="text-sm" style={{ color: "var(--color-sem-warning)" }}>
      {"★".repeat(level)}{"☆".repeat(3 - level)}
    </span>
  );
}

export default function QuestionDetail() {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<string | null>("C");
  const [schemaOpen, setSchemaOpen] = useState(false);

  return (
    <div className="pb-24">
      {/* ── 1. Sticky Header ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button
          type="button"
          className="text-text-primary text-lg"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-topic">{MOCK.topic}</span>
          <StarRating level={MOCK.difficulty} />
        </div>
      </header>

      {/* ── 2. Stem Card ── */}
      <section className="card-base mt-4">
        <p className="text-body">{MOCK.stem}</p>
      </section>

      {/* ── 3. Schema Card (collapsible) ── */}
      <section className="mt-3">
        <button
          type="button"
          className="flex items-center gap-2 text-secondary text-sm w-full"
          onClick={() => setSchemaOpen((prev) => !prev)}
        >
          <span>스키마 보기</span>
          <span className="text-text-caption">{schemaOpen ? "▲" : "▼"}</span>
        </button>
        {schemaOpen && (
          <pre className="code-block mt-2">
            <code>{MOCK.schema}</code>
          </pre>
        )}
      </section>

      {/* ── 4. Choice Cards ── */}
      <section className="mt-4 space-y-3">
        {MOCK.choices.map((choice) => {
          const isSelected = selectedKey === choice.key;
          const borderClass = isSelected ? "border-brand border-2" : "border-border";

          return (
            <div key={choice.key} className={`card-base ${borderClass}`}>
              {/* Choice header: Radio + Key */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  className={`radio-custom ${isSelected ? "radio-custom--selected" : ""}`}
                  onClick={() => setSelectedKey(choice.key)}
                  aria-label={`선택지 ${choice.key}`}
                />
                <span className="text-body font-bold">{choice.key}</span>
              </div>

              {/* SQL code block */}
              <pre className="code-block text-sm">
                <code>{choice.sql}</code>
              </pre>

              {/* Execute button */}
              <div className="flex justify-end mt-2">
                <button className="btn-compact" type="button">실행</button>
              </div>

              {/* Result: SUCCESS */}
              {choice.status === "success" && (
                <div className="success-card mt-3">
                  <p className="text-sm font-medium" style={{ color: "var(--color-sem-success-text)" }}>
                    ✓ {choice.result.rows}행 · {choice.result.ms}ms
                  </p>
                  <table className="data-table mt-2">
                    <thead>
                      <tr>
                        {choice.result.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {choice.result.data.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Result: ERROR */}
              {choice.status === "error" && (
                <div className="error-card mt-3">
                  <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
                    ⚠ {choice.error.code}
                  </span>
                  <p className="text-secondary mt-1">{choice.error.message}</p>
                  <div className="flex justify-end mt-2">
                    <button className="text-brand text-sm font-medium" type="button">
                      AI에게 물어보기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── 5. Sticky Submit Button ── */}
      <div className="fixed bottom-0 inset-x-0 lg:left-[220px] bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-body font-bold ${
              selectedKey
                ? "bg-brand text-white"
                : "bg-border text-text-caption cursor-not-allowed"
            }`}
            disabled={!selectedKey}
          >
            제출
          </button>
        </div>
      </div>
    </div>
  );
}
