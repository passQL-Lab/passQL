import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

/** 접힌 상태용 미리보기 — 마크다운 문법 제거 후 한 줄로 */
function stemPreview(stem: string): string {
  return stem
    .replace(/```[\s\S]*?```/g, "[SQL]")
    .replace(/\n/g, " ")
    .trim();
}

interface QuestionDetailProps {
  readonly practiceMode?: boolean;
  readonly practiceSubmitLabel?: string;
  readonly questionUuid?: string;
  // AI 코멘트 세션 집계용 — 연습/다시풀기 모드에서 store의 sessionId 전달
  readonly sessionUuid?: string;
  readonly onPracticeSubmit?: (
    selectedChoiceKey: string,
    choiceSetId: string,
    choices: readonly ChoiceItem[],
  ) => void;
  // 데일리 챌린지 모드: 제출 성공 시 호출자가 직접 네비게이션 제어
  readonly onSubmitSuccess?: (
    result: SubmitResult,
    questionUuid: string,
  ) => void;
  // 연습 모드에서 제출 후 true — ChoiceCard 안에 SQL 실행 버튼 표시
  readonly showExecution?: boolean;
}

export default function QuestionDetail({
  practiceMode,
  practiceSubmitLabel,
  questionUuid: propUuid,
  sessionUuid,
  onPracticeSubmit,
  onSubmitSuccess,
  showExecution = false,
}: QuestionDetailProps = {}) {
  const { questionUuid: paramUuid } = useParams<{ questionUuid: string }>();
  const questionUuid = propUuid ?? paramUuid;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!, sessionUuid);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // 제출 완료 여부 — true가 되면 이탈 차단 해제
  const [submitted, setSubmitted] = useState(false);
  const [stemOpen, setStemOpen] = useState(true);
  const [executeCache, setExecuteCache] = useState<
    Record<string, ExecuteResult>
  >({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  // 연타 방지 — key 변경(문제 교체) 시 컴포넌트 리마운트로 자동 초기화
  const isSubmittingRef = useRef(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");

  // SSE로 생성된 선택지 (choiceSets[]가 비어있을 때 채워짐)
  const [sseChoices, setSseChoices] = useState<readonly ChoiceItem[] | null>(
    null,
  );
  const [sseChoiceSetId, setSseChoiceSetId] = useState<string | null>(null);
  const [sseError, setSseError] = useState<{
    code: string;
    retryable: boolean;
  } | null>(null);
  // 재시도 트리거용 카운터
  const [sseRetryCount, setSseRetryCount] = useState(0);

  // questionUuid가 바뀌면 SSE 상태 전체 초기화
  // practiceMode에서 같은 컴포넌트 인스턴스로 문제가 교체될 때 이전 SSE 에러/결과가 남아
  // needsSseGeneration의 !sseError 조건을 막아 새 SSE가 발화되지 않는 문제 방지
  useEffect(() => {
    setSseChoices(null);
    setSseChoiceSetId(null);
    setSseError(null);
    setSseRetryCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionUuid]);

  // 단독 풀이 모드에서 제출 완료 전까지 이탈 차단 — practiceMode는 부모가 이미 차단하므로 제외
  // practiceMode !== true로 명시해 undefined(단독 모드 기본값)도 정확히 처리
  // submitMutation.isPending 중에도 해제: onSuccess의 navigate가 blocker에 걸리지 않게 (#146 동일 패턴)
  const blocker = useBlocker(practiceMode !== true && !submitted && !submitMutation.isPending);

  const activeChoiceSet = question?.choiceSets?.find(
    (cs) => cs.status === "OK",
  );
  // SSE로 받은 선택지가 있으면 우선 사용, 없으면 GET 응답의 choiceSets 사용
  const choices = sseChoices ?? activeChoiceSet?.items ?? [];
  const choiceSetId = sseChoiceSetId ?? activeChoiceSet?.choiceSetUuid ?? "";

  useEffect(() => {
    // question 비동기 로드 전이거나 UUID 없으면 스킵
    if (!question || !questionUuid) return;

    // SSE 생성이 필요 없는 조건:
    //   - GET 응답에 이미 OK 선택지 있음 (activeChoiceSet != null)
    //   - SSE complete로 받은 선택지 있음 (sseChoices != null)
    //   - 에러 상태 (재시도 버튼 대기 중, sseRetryCount 변경 시 다시 실행됨)
    const needsGeneration =
      (question.executionMode === "EXECUTABLE" ||
        question.executionMode === "CONCEPT_ONLY") &&
      activeChoiceSet == null &&
      sseChoices == null &&
      !sseError;

    if (!needsGeneration) return;

    // 60초 내에 complete/error가 오지 않으면 클라이언트 타임아웃으로 에러 전환
    // AI 호출 + 샌드박스 3회 재시도 합산 예상 시간 기준
    const SSE_TIMEOUT_MS = 60_000;
    let cancelled = false;
    let streamCleanup: (() => void) | null = null;
    const timeoutId = setTimeout(() => {
      streamCleanup?.();
      if (!cancelled) {
        setSseError({ code: "TIMEOUT", retryable: true });
      }
    }, SSE_TIMEOUT_MS);

    const cleanup = generateChoices(questionUuid, {
      onStatus: () => {},
      onComplete: (response) => {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setSseChoices(response.choices);
          setSseChoiceSetId(response.choiceSetId);
        }
      },
      onError: (event) => {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setSseError({ code: event.code, retryable: event.retryable });
        }
      },
    });
    streamCleanup = cleanup;

    return () => {
      // StrictMode 이중 실행: 첫 번째 cleanup에서 cancelled=true로 콜백 무력화 + abort
      // 두 번째 effect 실행 시 sseChoices/sseError가 여전히 null → needsGeneration=true
      // → 두 번째 effect가 실제 SSE 연결을 담당 (React 권장 패턴)
      cancelled = true;
      clearTimeout(timeoutId);
      cleanup();
    };
    // deps 설계:
    //   question      — 비동기 로드 완료 시 effect 실행 (null → 객체 전환 감지)
    //   questionUuid  — 문제 변경 시 새 SSE 시작
    //   sseRetryCount — 재시도 버튼 클릭 시 새 SSE 시작
    // sseChoices/sseError/activeChoiceSet은 effect 내부 needsGeneration 판단에만 사용
    // deps에 포함하면 onComplete/onError 콜백 후 effect가 재실행되어 중복 요청 발생
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, questionUuid, sseRetryCount]);

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

  const handleSelect = useCallback((choiceKey: string, _sql: string) => {
    // 풀이 중 SQL 자동 실행 없음 — 제출 후 결과 화면에서 실행
    setSelectedKey(choiceKey);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question || !choiceSetId) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (practiceMode && onPracticeSubmit) {
      onPracticeSubmit(selectedKey, choiceSetId, choices);
      return;
    }
    submitMutation.mutate(
      { choiceSetId, selectedChoiceKey: selectedKey },
      {
        onSuccess: (result) => {
          // 제출 완료 — 이탈 차단 해제 후 네비게이션
          setSubmitted(true);
          const fullResult = {
            ...result,
            selectedKey,
            questionUuid,
            // executionMode는 QuestionDetail에서 전달 (SubmitResult에서 제거됨)
            executionMode: question.executionMode,
            // 선택지 본문 전달: EXECUTABLE은 SQL 실행 비교용, CONCEPT_ONLY는 선택지 텍스트 표시용
            choices,
            // 결과 화면에서 문제 지문/토픽/스키마 표시용 — 백엔드 추가 호출 없이 전달
            stem: question.stem,
            topicName: question.topicName,
            schemaDisplay: question.schemaDisplay ?? null,
            schemaDdl: question.schemaDdl ?? null,
            schemaSampleData: question.schemaSampleData ?? null,
          };
          // 제출 완료 시 추천 문제·학습 현황 캐시 무효화 — 홈 복귀 시 목록·heatmap 즉시 갱신
          queryClient.invalidateQueries({ queryKey: ["recommendations"] });
          // heatmap·progress 무효화 — 학습 현황 캘린더와 streak 즉시 갱신
          queryClient.invalidateQueries({ queryKey: ["heatmap"] });
          queryClient.invalidateQueries({ queryKey: ["progress"] });
          if (onSubmitSuccess) {
            // 데일리 챌린지 등 호출자가 네비게이션 제어
            onSubmitSuccess(fullResult as SubmitResult, questionUuid!);
          } else {
            navigate(`/questions/${questionUuid}/result`, {
              state: fullResult,
            });
          }
        },
      },
    );
  }, [
    selectedKey,
    choiceSetId,
    choices,
    submitMutation,
    question,
    questionUuid,
    navigate,
    practiceMode,
    onPracticeSubmit,
    onSubmitSuccess,
    queryClient,
  ]);

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

  const choicesSection =
    choices.length === 0 ? (
      <div className="mt-4 bg-surface-card border border-border rounded-2xl text-center py-8 space-y-2">
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
            {/* Sparkles pulse-fast — AI 선택지 생성 중, 기본 pulse보다 1.5배 빠른 반짝임 */}
            <Sparkles
              size={28}
              className="mx-auto text-brand animate-pulse-fast"
              fill="currentColor"
            />
            <p className="text-text-caption text-sm">
              AI가 선택지를 만들고 있어요
            </p>
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
            // showExecution=true(제출 후)일 때만 실행 결과 표시
            cached={showExecution ? executeCache[choice.key] : undefined}
            // 제출 후(showExecution=true)에만 실행 버튼 표시
            isExecutable={showExecution && question.executionMode === "EXECUTABLE"}
            isExecuting={
              executeMutation.isPending &&
              executeMutation.variables === choice.body
            }
            // 제출 후 선택 변경 방지 — showExecution이면 no-op
            onSelect={showExecution ? () => {} : handleSelect}
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
      {submitMutation.isPending
        ? "제출 중..."
        : (practiceSubmitLabel ?? "답안 제출하기")}
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
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
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
        className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm w-full text-left flex items-start gap-2 mt-2"
        onClick={() => setStemOpen((prev) => !prev)}
      >
        {!stemOpen && (
          <BookOpen size={16} className="text-brand mt-0.5 shrink-0" />
        )}
        {stemOpen ? (
          // 펼친 상태: react-markdown으로 코드 블록 포함 마크다운 렌더링
          <div className="text-sm text-body min-w-0 w-full">
            <ReactMarkdown
              components={{
                code({ children, className }) {
                  // 코드 블록은 디자인 시스템 code-block 스타일 적용
                  const isBlock = className?.includes("language-");
                  return isBlock ? (
                    <pre className="bg-surface-code rounded-lg px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word font-mono">
                      <code>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-surface-code px-1 rounded text-xs font-mono">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {question.stem}
            </ReactMarkdown>
          </div>
        ) : (
          // 접힌 상태: 마크다운 문법 제거 후 한 줄 truncate
          <p className="text-body text-sm truncate">
            {stemPreview(question.stem)}
          </p>
        )}
      </button>

      {/* 스키마 */}
      {schemaSection}

      {/* 선택지 + SQL 실행기 */}
      {choicesSection}
      {question.executionMode === "EXECUTABLE" && (
        <SqlPlayground
          onExecute={(sql) => executeChoice(questionUuid!, sql)}
        />
      )}

      {/* fixed bottom 제출 버튼 — PracticeFeedbackBar(z-30)가 제출 후 자연스럽게 덮음 */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page">
        <div className="mx-auto max-w-120 px-4 py-4">{submitButton}</div>
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
