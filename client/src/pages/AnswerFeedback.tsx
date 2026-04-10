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
        label="정답 SQL"
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
