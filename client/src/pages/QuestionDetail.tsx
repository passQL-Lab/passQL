import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import AiExplanationSheet from "../components/AiExplanationSheet";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
} from "../hooks/useQuestionDetail";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";

interface QuestionDetailProps {
  readonly practiceMode?: boolean;
  readonly questionUuid?: string;
  readonly onPracticeSubmit?: (isCorrect: boolean, selectedChoiceKey: string) => void;
}

export default function QuestionDetail({ practiceMode, questionUuid: propUuid, onPracticeSubmit }: QuestionDetailProps = {}) {
  const { questionUuid: paramUuid } = useParams<{ questionUuid: string }>();
  const questionUuid = propUuid ?? paramUuid;
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  const choices = question?.choices ?? [];

  const explainMutation = useMutation({
    mutationFn: explainError,
    onSuccess: (result) => setAiText(result.text),
  });

  const handleExecute = useCallback(
    (choiceKey: string, sql: string) => {
      if (executeCacheRef.current[choiceKey]) return;
      executeMutation.mutate(sql, {
        onSuccess: (result) => {
          setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
        },
      });
    },
    [executeMutation],
  );

  const handleSelect = useCallback(
    (choiceKey: string, sql: string) => {
      setSelectedKey(choiceKey);
      if (question?.executionMode === "EXECUTABLE" && !executeCacheRef.current[choiceKey]) {
        handleExecute(choiceKey, sql);
      }
    },
    [handleExecute, question],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question) return;
    submitMutation.mutate(selectedKey, {
      onSuccess: (result) => {
        if (practiceMode && onPracticeSubmit) {
          onPracticeSubmit(result.isCorrect, selectedKey!);
          return;
        }
        const selectedChoice = choices.find((c) => c.key === selectedKey);
        const correctChoice = choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionUuid,
          },
        });
      },
    });
  }, [selectedKey, submitMutation, question, choices, questionUuid, navigate, practiceMode, onPracticeSubmit]);

  const handleAskAi = useCallback(
    (choiceKey: string, _errorCode: string, errorMessage: string) => {
      setAiSheetOpen(true);
      setAiText("");
      const choice = choices.find((c) => c.key === choiceKey);
      explainMutation.mutate({
        questionUuid: questionUuid!,
        sql: choice?.body ?? "",
        errorMessage,
      });
    },
    [choices, questionUuid, explainMutation],
  );

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

  const isSubmitReady =
    selectedKey !== null &&
    choices.length > 0 &&
    !submitMutation.isPending;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button
          type="button"
          className="text-text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-caption">
            {questionUuid?.slice(0, 8)}
          </span>
          <span className="badge-topic">{question.topicName}</span>
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
            {schemaOpen ? (
              <ChevronUp size={16} className="text-text-caption" />
            ) : (
              <ChevronDown size={16} className="text-text-caption" />
            )}
          </button>
          {schemaOpen && (
            <pre className="code-block mt-2">
              <code>{question.schemaDisplay}</code>
            </pre>
          )}
        </section>
      )}

      {choices.length === 0 ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card-base space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-border animate-pulse" />
                <div className="w-4 h-4 rounded bg-border animate-pulse" />
              </div>
              <div className="h-16 rounded-lg bg-border animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <section className="mt-4 space-y-3">
          {choices.map((choice) => (
            <ChoiceCard
              key={choice.key}
              choice={choice}
              isSelected={selectedKey === choice.key}
              cached={executeCache[choice.key]}
              isExecutable={question.executionMode === "EXECUTABLE"}
              isExecuting={
                executeMutation.isPending &&
                executeMutation.variables === choice.body
              }
              onSelect={handleSelect}
              onExecute={handleExecute}
              onAskAi={handleAskAi}
            />
          ))}
        </section>
      )}

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={explainMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      <div className="fixed bottom-0 inset-x-0 lg:left-55 bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-base font-bold ${
              isSubmitReady
                ? "bg-brand text-white"
                : "bg-border text-text-caption cursor-not-allowed"
            }`}
            disabled={!isSubmitReady}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? "제출 중..." : "답안 제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
