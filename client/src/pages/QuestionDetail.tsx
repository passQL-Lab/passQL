import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import { useQuestionDetail, useExecuteChoice, useSubmitAnswer } from "../hooks/useQuestionDetail";
import type { ExecuteResult } from "../types/api";

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
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;

  const handleExecute = useCallback((choiceKey: string, sql: string) => {
    if (executeCacheRef.current[choiceKey]) return;
    executeMutation.mutate(sql, {
      onSuccess: (result) => {
        setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
      },
    });
  }, [executeMutation]);

  const handleSelect = useCallback((choiceKey: string, sql: string) => {
    setSelectedKey(choiceKey);
    if (!executeCacheRef.current[choiceKey]) {
      handleExecute(choiceKey, sql);
    }
  }, [handleExecute]);

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question) return;
    submitMutation.mutate(selectedKey, {
      onSuccess: (result) => {
        const selectedChoice = question.choices.find((c) => c.key === selectedKey);
        const correctChoice = question.choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionId}/result`, {
          state: { ...result, selectedKey, selectedSql: selectedChoice?.body, correctSql: correctChoice?.body, questionId },
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
          {Array.from({ length: 4 }, (_, i) => (<div key={i} className="h-40 bg-border animate-pulse rounded-xl" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button type="button" className="text-text-primary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2">
          <span className="badge-topic">{question.topicCode}</span>
          <StarRating level={question.difficulty} />
        </div>
      </header>
      <section className="card-base mt-4"><p className="text-body">{question.stem}</p></section>
      {question.schemaDisplay && (
        <section className="mt-3">
          <button type="button" className="flex items-center gap-2 text-secondary text-sm w-full" onClick={() => setSchemaOpen((prev) => !prev)}>
            <span>스키마 보기</span>
            {schemaOpen ? <ChevronUp size={16} className="text-text-caption" /> : <ChevronDown size={16} className="text-text-caption" />}
          </button>
          {schemaOpen && (<pre className="code-block mt-2"><code>{question.schemaDisplay}</code></pre>)}
        </section>
      )}
      <section className="mt-4 space-y-3">
        {question.choices.map((choice) => (
          <ChoiceCard
            key={choice.key}
            choice={choice}
            isSelected={selectedKey === choice.key}
            cached={executeCache[choice.key]}
            isExecutable={question.executionMode === "EXECUTABLE"}
            isExecuting={executeMutation.isPending && executeMutation.variables === choice.body}
            onSelect={handleSelect}
            onExecute={handleExecute}
          />
        ))}
      </section>
      <div className="fixed bottom-0 inset-x-0 lg:left-55 bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-body font-bold ${selectedKey && !submitMutation.isPending ? "bg-brand text-white" : "bg-border text-text-caption cursor-not-allowed"}`}
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
