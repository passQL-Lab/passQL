import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import { ChoicesSkeleton } from "../components/ChoicesSkeleton";
import AiExplanationSheet from "../components/AiExplanationSheet";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
  useGenerateChoices,
} from "../hooks/useQuestionDetail";
import { usePrefetch } from "../hooks/usePrefetch";
import { fetchRecommendations } from "../api/questions";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";

export default function QuestionDetail() {
  const { questionUuid } = useParams<{ questionUuid: string }>();
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const { prefetch, consumeCache } = usePrefetch();
  const prefetchedRef = useRef(consumeCache(questionUuid!));
  const { state: choicesState, retry: retryGenerate } = useGenerateChoices(questionUuid!, prefetchedRef.current);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const prefetchTriggeredRef = useRef(false);

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
      // Trigger prefetch for next question on first selection
      if (!prefetchTriggeredRef.current) {
        prefetchTriggeredRef.current = true;
        fetchRecommendations(1, questionUuid)
          .then((res) => {
            const nextUuid = res.questions[0]?.questionUuid;
            if (nextUuid) prefetch(nextUuid);
          })
          .catch(() => {}); // Prefetch failure is silent
      }
    },
    [handleExecute, prefetch, questionUuid, question],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question || choicesState.kind !== "done") return;
    const { choiceSetId, choices } = choicesState;
    submitMutation.mutate(
      { choiceSetId, selectedChoiceKey: selectedKey },
      {
        onSuccess: (result) => {
          const selectedChoice = choices.find((c) => c.key === selectedKey);
          const correctChoice = choices.find((c) => c.key === result.correctKey);
          navigate(`/questions/${questionUuid}/result`, {
            state: {
              ...result,
              selectedKey,
              selectedSql: selectedChoice?.body,
              correctSql: correctChoice?.body,
              questionUuid,
              choiceSetId,
            },
          });
        },
      },
    );
  }, [selectedKey, submitMutation, question, choicesState, questionUuid, navigate]);

  const handleAskAi = useCallback(
    (choiceKey: string, _errorCode: string, errorMessage: string) => {
      setAiSheetOpen(true);
      setAiText("");
      if (choicesState.kind !== "done") return;
      const choice = choicesState.choices.find((c) => c.key === choiceKey);
      explainMutation.mutate({
        questionUuid: questionUuid!,
        sql: choice?.body ?? "",
        error_message: errorMessage,
      });
    },
    [choicesState, questionUuid, explainMutation],
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
    choicesState.kind === "done" &&
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

      {/* Choices area — driven by SSE state */}
      {choicesState.kind === "loading" && (
        <ChoicesSkeleton phase={choicesState.phase} message={choicesState.message} />
      )}

      {choicesState.kind === "error" && (
        <div className="mt-4 card-base text-center space-y-3">
          <p className="text-secondary">
            {choicesState.error.retryable
              ? "일시적인 문제가 발생했습니다. 다시 시도해 보세요"
              : "선택지 생성에 실패했습니다"}
          </p>
          {choicesState.error.retryable ? (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={retryGenerate}
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/questions")}
            >
              문제 목록으로
            </button>
          )}
        </div>
      )}

      {choicesState.kind === "done" && (
        <section className="mt-4 space-y-3">
          {choicesState.choices.map((choice) => (
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
