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
  // RESULT_MATCH 선택지 판별: kind===TEXT + body가 JSON 배열
  const isResultMatch = choice.kind === "TEXT" && isJsonArray(choice.body);
  // CONCEPT_ONLY 텍스트 선택지: kind===TEXT + body가 JSON 배열 아님
  const isConceptText = choice.kind === "TEXT" && !isJsonArray(choice.body);

  return (
    // div[role=button]로 감싸야 내부 <button> (실행, AI에게 물어보기)이 중첩 버튼 위반 없이 동작한다
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`w-full text-left rounded-xl p-4 shadow-sm transition-all duration-200 cursor-pointer border ${isSelected ? "choice-card-selected" : "choice-card-unselected"}`}
      onClick={() => onSelect(choice.key, choice.body)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(choice.key, choice.body);
        }
      }}
    >
      {isResultMatch ? (
        // RESULT_MATCH: JSON 결과 테이블 렌더링, 실행 버튼 없음
        <div onClick={(e) => e.stopPropagation()}>
          <ResultMatchTable body={choice.body} />
        </div>
      ) : isConceptText ? (
        // CONCEPT_ONLY: 일반 텍스트 렌더링 — 선택 시 흰색으로 반전
        <p className={`text-body ${isSelected ? "choice-text-inverted" : ""}`}>{choice.body}</p>
      ) : (
        // EXECUTABLE SQL: 모노 폰트 + 실행 버튼 (풀이 중 isExecutable=false로 숨김)
        <>
          <p
            className={`text-mono text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${isSelected ? "choice-text-inverted" : ""}`}
          >
            {choice.body}
          </p>
          {isExecutable && (
            <div
              className="flex justify-end mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`btn-compact ${isSelected ? "btn-compact-inverted" : ""}`}
                type="button"
                onClick={() => onExecute(choice.key, choice.body)}
                disabled={!!cached || isExecuting}
              >
                {isExecuting ? "실행 중..." : "실행"}
              </button>
            </div>
          )}
          {cached && (
            <div onClick={(e) => e.stopPropagation()}>
              {/* 선택된 카드(brand 배경)에서는 흰색 카드로 감싸 가독성 확보 */}
              {isSelected ? (
                <div className="bg-white rounded-xl mt-2 px-2 pb-2">
                  <ResultTable
                    result={cached}
                    onAskAi={
                      cached.errorCode
                        ? () => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")
                        : undefined
                    }
                  />
                </div>
              ) : (
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
          )}
        </>
      )}
    </div>
  );
});
