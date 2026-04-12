import { useState, useCallback } from "react";
import { executeChoice } from "../api/questions";
import { ResultTable } from "./ResultTable";
import type { ChoiceItem, ExecuteResult } from "../types/api";

interface ChoiceReviewProps {
  readonly choices: readonly ChoiceItem[];
  readonly questionUuid: string;
  readonly selectedKey?: string;
}

/** 제출 후 오답노트 — 각 선택지 SQL을 직접 실행해 결과를 비교한다 */
export default function ChoiceReview({ choices, questionUuid, selectedKey }: ChoiceReviewProps) {
  // key → ExecuteResult | "loading"
  const [results, setResults] = useState<Record<string, ExecuteResult | "loading">>({});
  // 실행 실패 시 사용자에게 표시할 에러 메시지 (key → errorMessage)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // RESULT_MATCH 선택지(TEXT kind)는 SQL이 아니므로 실행 대상에서 제외
  const sqlChoices = choices.filter((c) => c.kind === "SQL");

  const handleExecute = useCallback(async (choice: ChoiceItem) => {
    if (results[choice.key]) return;
    setErrors((prev) => { const next = { ...prev }; delete next[choice.key]; return next; });
    setResults((prev) => ({ ...prev, [choice.key]: "loading" }));
    try {
      const result = await executeChoice(questionUuid, choice.body);
      setResults((prev) => ({ ...prev, [choice.key]: result }));
    } catch (err) {
      // 실행 실패 시 에러 메시지를 저장해 재시도 안내를 표시한다
      const message = err instanceof Error ? err.message : "실행에 실패했습니다";
      setErrors((prev) => ({ ...prev, [choice.key]: message }));
      setResults((prev) => {
        const next = { ...prev };
        delete next[choice.key];
        return next;
      });
    }
  }, [questionUuid, results]);

  if (sqlChoices.length === 0) return null;

  return (
    <section className="mt-6 mb-40">
      <p className="text-secondary text-sm mb-3">SQL 실행 비교</p>
      <div className="space-y-3">
        {sqlChoices.map((choice) => {
          const isSelected = choice.key === selectedKey;
          const result = results[choice.key];
          const isLoading = result === "loading";
          const errorMessage = errors[choice.key];

          return (
            <div
              key={choice.key}
              className="rounded-xl p-4 transition-colors"
              style={{
                backgroundColor: "var(--color-surface-card)",
                border: `1px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
                borderLeft: `4px solid ${isSelected ? "var(--color-brand)" : "var(--color-border)"}`,
              }}
            >
              {/* SQL 본문 */}
              <pre
                className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word mb-3"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
              >
                {choice.body}
              </pre>

              {/* 실행 버튼 / 에러 안내 */}
              {errorMessage ? (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm" style={{ color: "var(--color-sem-error)" }}>{errorMessage}</p>
                  <button
                    type="button"
                    className="btn-compact"
                    onClick={() => handleExecute(choice)}
                  >
                    재시도
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-compact"
                    onClick={() => handleExecute(choice)}
                    disabled={!!result}
                  >
                    {isLoading ? "실행 중..." : "실행"}
                  </button>
                </div>
              )}

              {/* 실행 결과 */}
              {result && !isLoading && (
                <div className="mt-2">
                  <ResultTable result={result} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
