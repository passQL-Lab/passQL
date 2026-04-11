import { memo } from "react";
import type { ChoiceItem, ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";
import { ResultMatchTable } from "./ResultMatchTable";

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

/** body가 JSON 배열인지 판별 — RESULT_MATCH 선택지 감지용 */
function isJsonArray(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
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

  // RESULT_MATCH 선택지 판별: kind===TEXT + body가 JSON 배열
  const isResultMatch = choice.kind === "TEXT" && isJsonArray(choice.body);
  // CONCEPT_ONLY 텍스트 선택지: kind===TEXT + body가 JSON 배열 아님
  const isConceptText = choice.kind === "TEXT" && !isJsonArray(choice.body);

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

          {isResultMatch ? (
            // RESULT_MATCH: JSON 배열 → 컴팩트 결과 테이블 렌더링, 실행 버튼 없음
            <ResultMatchTable body={choice.body} />
          ) : isConceptText ? (
            // CONCEPT_ONLY: 일반 텍스트 렌더링
            <p className="text-body text-sm">{choice.body}</p>
          ) : (
            // EXECUTABLE SQL: 코드 블록 + 실행 버튼
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
});
