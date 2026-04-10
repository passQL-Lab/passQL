import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown, BookOpen } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { SchemaViewer } from "../components/SchemaViewer";
import { SqlPlayground } from "../components/SqlPlayground";
import { executeChoice } from "../api/questions";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
} from "../hooks/useQuestionDetail";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";

interface QuestionDetailProps {
  readonly practiceMode?: boolean;
  readonly practiceSubmitLabel?: string;
  readonly questionUuid?: string;
  readonly onPracticeSubmit?: (selectedChoiceKey: string, choiceSetId: string) => void;
}

export default function QuestionDetail({ practiceMode, practiceSubmitLabel, questionUuid: propUuid, onPracticeSubmit }: QuestionDetailProps = {}) {
  const { questionUuid: paramUuid } = useParams<{ questionUuid: string }>();
  const questionUuid = propUuid ?? paramUuid;
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [stemOpen, setStemOpen] = useState(true);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  const activeChoiceSet = question?.choiceSets?.find((cs) => cs.status === "OK");
  const choices = activeChoiceSet?.items ?? [];
  // 제출 시 BE에 전달할 choiceSetId (SSE 미사용 시 ADMIN_SEED choiceSet UUID 사용)
  const choiceSetId = activeChoiceSet?.choiceSetUuid ?? "";

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
    if (practiceMode && onPracticeSubmit) {
      onPracticeSubmit(selectedKey, choiceSetId);
      return;
    }
    submitMutation.mutate({ choiceSetId, selectedChoiceKey: selectedKey }, {
      onSuccess: (result) => {
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            questionUuid,
            // executionMode는 QuestionDetail에서 전달 (SubmitResult에서 제거됨)
            executionMode: question.executionMode,
          },
        });
      },
    });
  }, [selectedKey, choiceSetId, submitMutation, question, questionUuid, navigate, practiceMode, onPracticeSubmit]);

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

  const schemaSection = question.schemaDisplay ? (
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
        <SchemaViewer
          schemaDisplay={question.schemaDisplay}
          schemaDdl={question.schemaDdl}
          schemaSampleData={question.schemaSampleData}
          schemaIntent={question.schemaIntent}
        />
      )}
    </section>
  ) : null;

  const choicesSection = choices.length === 0 ? (
    <div className="mt-4 card-base text-center py-8">
      <p className="text-text-caption">선택지가 아직 준비되지 않았어요</p>
      <p className="text-xs text-text-caption mt-1">잠시 후 다시 시도해주세요</p>
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
  );

  const submitButton = (
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
      {submitMutation.isPending ? "제출 중..." : (practiceSubmitLabel ?? "답안 제출하기")}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 헤더: 일반 모드에서만 뒤로가기 + 메타 정보 */}
      {!practiceMode && (
        <header className="flex items-center justify-between h-14 px-4">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <div className="flex items-center gap-2">
            <span className="badge-topic">{question.topicName}</span>
            <StarRating level={question.difficulty} />
          </div>
        </header>
      )}

      {/* Sticky: 문제 지문 (토글) + 스키마 (토글) */}
      <div className="sticky top-0 z-10 bg-surface px-1 pb-2">
        <button
          type="button"
          className="card-base w-full text-left flex items-start gap-2 mt-2"
          onClick={() => setStemOpen((prev) => !prev)}
        >
          <BookOpen size={16} className="text-brand mt-0.5 shrink-0" />
          {stemOpen ? (
            <p className="text-body text-sm">{question.stem}</p>
          ) : (
            <p className="text-body text-sm truncate">{question.stem}</p>
          )}
        </button>
        {schemaSection}
      </div>

      {/* 스크롤: 선택지 + SQL 실행기 */}
      <div className="flex-1 overflow-y-auto px-1">
        {choicesSection}
        {question.executionMode === "EXECUTABLE" && (
          <SqlPlayground
            questionUuid={questionUuid!}
            onExecute={(sql) => executeChoice(questionUuid!, sql)}
          />
        )}
      </div>

      {/* 하단: 버튼 */}
      <div className="px-4 pb-4 pt-2">
        {submitButton}
      </div>

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={explainMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />
    </div>
  );
}
