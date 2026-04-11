import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, RefreshCw } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { SchemaViewer } from "../components/SchemaViewer";
import { SqlPlayground } from "../components/SqlPlayground";
import LoadingOverlay from "../components/LoadingOverlay";
import { executeChoice, generateChoices } from "../api/questions";
import {
  useQuestionDetail,
  useExecuteChoice,
  useSubmitAnswer,
} from "../hooks/useQuestionDetail";
import { explainError } from "../api/ai";
import ConfirmModal from "../components/ConfirmModal";
import type { ChoiceItem, ExecuteResult, SubmitResult } from "../types/api";

interface QuestionDetailProps {
  readonly practiceMode?: boolean;
  readonly practiceSubmitLabel?: string;
  readonly questionUuid?: string;
  readonly onPracticeSubmit?: (selectedChoiceKey: string, choiceSetId: string, choices: readonly ChoiceItem[]) => void;
  // 데일리 챌린지 모드: 제출 성공 시 호출자가 직접 네비게이션 제어
  readonly onSubmitSuccess?: (result: SubmitResult, questionUuid: string) => void;
}

export default function QuestionDetail({ practiceMode, practiceSubmitLabel, questionUuid: propUuid, onPracticeSubmit, onSubmitSuccess }: QuestionDetailProps = {}) {
  const { questionUuid: paramUuid } = useParams<{ questionUuid: string }>();
  const questionUuid = propUuid ?? paramUuid;
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // 제출 완료 여부 — true가 되면 이탈 차단 해제
  const [submitted, setSubmitted] = useState(false);
  const [stemOpen, setStemOpen] = useState(true);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  // SSE로 생성된 선택지 (choiceSets[]가 비어있을 때 채워짐)
  const [sseChoices, setSseChoices] = useState<readonly ChoiceItem[] | null>(null);
  const [sseChoiceSetId, setSseChoiceSetId] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<string | null>(null);
  const [sseError, setSseError] = useState<{ code: string; retryable: boolean } | null>(null);
  // 재시도 트리거용 카운터
  const [sseRetryCount, setSseRetryCount] = useState(0);

  // 단독 풀이 모드에서 제출 완료 전까지 이탈 차단 — practiceMode는 부모가 이미 차단하므로 제외
  // practiceMode !== true로 명시해 undefined(단독 모드 기본값)도 정확히 처리
  const blocker = useBlocker(practiceMode !== true && !submitted);

  const activeChoiceSet = question?.choiceSets?.find((cs) => cs.status === "OK");
  // SSE로 받은 선택지가 있으면 우선 사용, 없으면 GET 응답의 choiceSets 사용
  const choices = sseChoices ?? activeChoiceSet?.items ?? [];
  const choiceSetId = sseChoiceSetId ?? activeChoiceSet?.choiceSetUuid ?? "";

  // 선택지가 없고 에러도 없을 때 SSE 선택지 생성 호출
  // EXECUTABLE: 샌드박스 검증을 포함한 SQL 선택지 생성
  // CONCEPT_ONLY: 샌드박스 없이 AI가 텍스트 선택지를 직접 생성 (서버의 generateConcept 호출)
  const needsSseGeneration =
    question != null &&
    (question.executionMode === "EXECUTABLE" ||
      question.executionMode === "CONCEPT_ONLY") &&
    activeChoiceSet == null &&
    sseChoices == null &&
    !sseError;
  useEffect(() => {
    if (!needsSseGeneration || !questionUuid) return;

    setSseError(null);
    setSseStatus("선택지 생성 중...");

    // 60초 내에 complete/error가 오지 않으면 클라이언트 타임아웃으로 에러 전환
    // AI 호출 + 샌드박스 3회 재시도 합산 예상 시간 기준
    const SSE_TIMEOUT_MS = 60_000;
    let streamCleanup: (() => void) | null = null;
    const timeoutId = setTimeout(() => {
      // 타임아웃 시 스트림도 abort — 이후 onComplete/onError 콜백 차단
      streamCleanup?.();
      setSseError({ code: "TIMEOUT", retryable: true });
      setSseStatus(null);
    }, SSE_TIMEOUT_MS);

    const cleanup = generateChoices(questionUuid, {
      onStatus: (event) => setSseStatus(event.message),
      onComplete: (response) => {
        clearTimeout(timeoutId);
        setSseChoices(response.choices);
        setSseChoiceSetId(response.choiceSetId);
        setSseStatus(null);
      },
      onError: (event) => {
        clearTimeout(timeoutId);
        setSseError({ code: event.code, retryable: event.retryable });
        setSseStatus(null);
      },
    });
    // 타임아웃 콜백에서 abort할 수 있도록 참조 저장
    streamCleanup = cleanup;

    return () => {
      clearTimeout(timeoutId);
      cleanup();
    };
  // sseRetryCount를 의존성에 포함해 재시도 시 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSseGeneration, questionUuid, sseRetryCount]);

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
    (choiceKey: string, _sql: string) => {
      // 풀이 중 SQL 자동 실행 없음 — 제출 후 ChoiceReview에서 직접 실행
      setSelectedKey(choiceKey);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question || !choiceSetId) return;
    if (practiceMode && onPracticeSubmit) {
      onPracticeSubmit(selectedKey, choiceSetId, choices);
      return;
    }
    submitMutation.mutate({ choiceSetId, selectedChoiceKey: selectedKey }, {
      onSuccess: (result) => {
        // 제출 완료 — 이탈 차단 해제 후 네비게이션
        setSubmitted(true);
        const fullResult = {
          ...result,
          selectedKey,
          questionUuid,
          // executionMode는 QuestionDetail에서 전달 (SubmitResult에서 제거됨)
          executionMode: question.executionMode,
          // EXECUTABLE 문제: 제출 후 오답노트에서 선택지 SQL 실행 비교용
          choices: question.executionMode === "EXECUTABLE" ? choices : undefined,
        };
        if (onSubmitSuccess) {
          // 데일리 챌린지 등 호출자가 네비게이션 제어
          onSubmitSuccess(fullResult as SubmitResult, questionUuid!);
        } else {
          navigate(`/questions/${questionUuid}/result`, { state: fullResult });
        }
      },
    });
  }, [selectedKey, choiceSetId, choices, submitMutation, question, questionUuid, navigate, practiceMode, onPracticeSubmit, onSubmitSuccess]);

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
    // standalone 모드: 전체화면 컨테이너, practiceMode: 부모(DailyChallenge)가 컨테이너 제공
    const loadingClass = practiceMode
      ? "py-6 space-y-4"
      : "min-h-screen bg-surface py-6 space-y-4 max-w-120 mx-auto w-full px-4";
    return (
      <div className={loadingClass}>
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
    choiceSetId !== "" &&
    !submitMutation.isPending;

  // schemaDisplay가 없어도 schemaDdl이 있으면 SchemaViewer가 폴백으로 파싱해서 표시
  const hasSchema = question.schemaDisplay || question.schemaDdl;
  const schemaSection = hasSchema ? (
    <section className="mt-3">
      <SchemaViewer
        schemaDisplay={question.schemaDisplay}
        schemaDdl={question.schemaDdl}
        schemaSampleData={question.schemaSampleData}
        schemaIntent={question.schemaIntent}
      />
    </section>
  ) : null;

  // 에러 코드별 사용자 메시지 — 기술적 코드 대신 이해하기 쉬운 문구 표시
  const sseErrorMessage = sseError
    ? sseError.code === "TIMEOUT"
      ? "선택지 생성 시간이 초과되었어요"
      : sseError.code === "STREAM_CLOSED"
        ? "서버 연결이 예기치 않게 끊겼어요"
        : "선택지 생성에 실패했어요"
    : null;

  const choicesSection = choices.length === 0 ? (
    <div className="mt-4 card-base text-center py-8 space-y-2">
      {/* SSE 에러 → 재시도 UI (EXECUTABLE, CONCEPT_ONLY 공통) */}
      {sseError ? (
        <>
          <p className="text-text-caption text-sm">{sseErrorMessage}</p>
          {sseError.retryable && (
            <button
              type="button"
              className="flex items-center gap-1.5 mx-auto text-brand text-sm font-medium"
              onClick={() => {
                setSseChoices(null);
                setSseChoiceSetId(null);
                setSseError(null);
                setSseRetryCount((c) => c + 1);
              }}
            >
              <RefreshCw size={14} />
              다시 시도
            </button>
          )}
        </>
      ) : (
        <>
          <div role="status" aria-label="선택지 생성 중" className="w-6 h-6 border-2 border-accent-light border-t-brand rounded-full animate-spin mx-auto" />
          <p className="text-text-caption text-sm">{sseStatus ?? "선택지 준비 중..."}</p>
        </>
      )}
    </div>
  ) : (
    <section className="mt-4 space-y-3">
      {choices.map((choice) => (
        <ChoiceCard
          key={choice.key}
          choice={choice}
          isSelected={selectedKey === choice.key}
          cached={executeCache[choice.key]}
          // 풀이 중 실행 버튼 숨김 — 제출 후 ChoiceReview에서 SQL 실행 비교
          isExecutable={false}
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
      className={`w-full btn-primary ${!isSubmitReady ? "opacity-40 cursor-not-allowed" : ""}`}
      disabled={!isSubmitReady}
      onClick={handleSubmit}
    >
      {submitMutation.isPending ? "제출 중..." : (practiceSubmitLabel ?? "답안 제출하기")}
    </button>
  );

  // standalone 모드: 전체화면 + max-w-120 집중 레이아웃 (DailyChallenge와 동일)
  // practiceMode: DailyChallenge가 외부 컨테이너(flex-1 overflow-y-auto px-4) 제공
  // pb-24: fixed bottom 버튼 높이만큼 스크롤 영역 하단 여백 확보
  const containerClass = practiceMode
    ? "flex flex-col px-1 pb-24"
    : "flex flex-col min-h-screen bg-surface max-w-120 mx-auto w-full px-4 pb-24";

  return (
    <div className={containerClass}>
      {/* 헤더: 일반 모드에서만 뒤로가기 + 메타 정보 */}
      {!practiceMode && (
        <header className="flex items-center justify-between h-14 px-3">
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

      {/* 문제 지문 (토글) */}
      <button
        type="button"
        className="card-base shadow-sm w-full text-left flex items-start gap-2 mt-2"
        onClick={() => setStemOpen((prev) => !prev)}
      >
        <BookOpen size={16} className="text-brand mt-0.5 shrink-0" />
        {stemOpen ? (
          <p className="text-body text-sm">{question.stem}</p>
        ) : (
          <p className="text-body text-sm truncate">{question.stem}</p>
        )}
      </button>

      {/* 스키마 */}
      {schemaSection}

      {/* 선택지 + SQL 실행기 */}
      {choicesSection}
      {question.executionMode === "EXECUTABLE" && (
        <SqlPlayground
          questionUuid={questionUuid!}
          onExecute={(sql) => executeChoice(questionUuid!, sql)}
        />
      )}

      {/* fixed bottom 제출 버튼 — PracticeFeedbackBar(z-30)가 제출 후 자연스럽게 덮음 */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page border-t border-border">
        <div className="mx-auto max-w-120 px-4 py-4">
          {submitButton}
        </div>
      </div>

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={explainMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      {/* 채점 중 오버레이 — API 호출 기간 동안 표시 */}
      {submitMutation.isPending && (
        <LoadingOverlay
          topicName={question.topicName}
          staticMessage="채점 중..."
          subMessage="정답을 확인하고 있어요"
        />
      )}

      {/* 단독 풀이 모드에서만 이탈 방지 모달 표시 */}
      {!practiceMode && (
        <ConfirmModal
          isOpen={blocker.state === "blocked"}
          title="풀이를 그만할까요?"
          description="지금 나가면 현재 풀이 기록이 저장되지 않아요."
          cancelLabel="계속 풀기"
          confirmLabel="나가기"
          onCancel={() => blocker.reset?.()}
          onConfirm={() => blocker.proceed?.()}
        />
      )}
    </div>
  );
}
