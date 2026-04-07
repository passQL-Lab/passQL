import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useQuestionDetail, useExecuteChoice, useSubmitAnswer } from "../hooks/useQuestionDetail";
import type { ExecuteResult } from "../types/api";
import { StarRating } from "../components/StarRating";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const questionId = Number(id);
  const navigate = useNavigate();

  const { data: question, isLoading } = useQuestionDetail(questionId);
  const executeMutation = useExecuteChoice(questionId);
  const submitMutation = useSubmitAnswer(questionId);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});

  const handleExecute = useCallback((choiceKey: string) => {
    if (executeCache[choiceKey]) return;
    executeMutation.mutate(choiceKey, {
      onSuccess: (result) => {
        setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
      },
    });
  }, [executeCache, executeMutation]);

  const handleSelect = useCallback((choiceKey: string) => {
    setSelectedKey(choiceKey);
    if (!executeCache[choiceKey]) {
      handleExecute(choiceKey);
    }
  }, [executeCache, handleExecute]);

  const handleSubmit = useCallback(() => {
    if (!selectedKey) return;
    submitMutation.mutate(selectedKey, {
      onSuccess: (result) => {
        const selectedChoice = question?.choices.find((c) => c.key === selectedKey);
        const correctChoice = question?.choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionId}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionId,
          },
        });
      },
    });
  }, [selectedKey, submitMutation, question, questionId, navigate]);

  if (isLoading || !question) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-14 bg-border animate-pulse rounded" />
        <div className="h-24 bg-border animate-pulse rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-40 bg-border animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button type="button" className="text-text-primary" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="badge-topic">{question.topicCode}</span>
          <StarRating level={question.difficulty} />
        </div>
      </header>

      <section className="card-base mt-4">
        <p className="text-body">{question.stem}</p>
      </section>

      {question.schemaDisplay && (
        <section className="mt-3">
          <button
            type="button"
            className="flex items-center gap-2 text-secondary text-sm w-full"
            onClick={() => setSchemaOpen((prev) => !prev)}
          >
            <span>스키마 보기</span>
            {schemaOpen ? <ChevronUp size={16} className="text-text-caption" /> : <ChevronDown size={16} className="text-text-caption" />}
          </button>
          {schemaOpen && (
            <pre className="code-block mt-2">
              <code>{question.schemaDisplay}</code>
            </pre>
          )}
        </section>
      )}

      <section className="mt-4 space-y-3">
        {question.choices.map((choice) => {
          const isSelected = selectedKey === choice.key;
          const borderClass = isSelected ? "border-brand border-2" : "border-border";
          const cached = executeCache[choice.key];

          return (
            <div key={choice.key} className={`card-base ${borderClass}`}>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  className={`radio-custom ${isSelected ? "radio-custom--selected" : ""}`}
                  onClick={() => handleSelect(choice.key)}
                  aria-label={`선택지 ${choice.key}`}
                />
                <span className="text-body font-bold">{choice.key}</span>
              </div>

              <pre className="code-block text-sm">
                <code>{choice.body}</code>
              </pre>

              {question.executionMode === "EXECUTABLE" && (
                <div className="flex justify-end mt-2">
                  <button
                    className="btn-compact"
                    type="button"
                    onClick={() => handleExecute(choice.key)}
                    disabled={!!cached || executeMutation.isPending}
                  >
                    {executeMutation.isPending && executeMutation.variables === choice.key ? "실행 중..." : "실행"}
                  </button>
                </div>
              )}

              {cached && !cached.errorCode && (
                <div className="success-card mt-3">
                  <p className="text-sm font-medium" style={{ color: "var(--color-sem-success-text)" }}>
                    <Check size={14} className="inline" /> {cached.rowCount}행 · {cached.elapsedMs}ms
                  </p>
                  {cached.columns.length > 0 && (
                    <table className="data-table mt-2">
                      <thead>
                        <tr>
                          {cached.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cached.rows.map((row, i) => (
                          <tr key={i}>
                            {(row as unknown[]).map((cell, j) => (
                              <td key={j}>{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {cached?.errorCode && (
                <div className="error-card mt-3">
                  <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>
                    <AlertTriangle size={14} className="inline" /> {cached.errorCode}
                  </span>
                  <p className="text-secondary mt-1">{cached.errorMessage}</p>
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

      <div className="fixed bottom-0 inset-x-0 lg:left-55 bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-body font-bold ${
              selectedKey && !submitMutation.isPending
                ? "bg-brand text-white"
                : "bg-border text-text-caption cursor-not-allowed"
            }`}
            disabled={!selectedKey || submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? "제출 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
