import { useState, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import { executeChoice } from "../api/questions";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { ResultTable } from "../components/ResultTable";
import { useSimilarQuestions } from "../hooks/useSimilarQuestions";
import type { ChoiceItem, ExecuteResult, ExecutionMode } from "../types/api";

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql: string | null;
  readonly correctSql: string | null;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult: ExecuteResult | null;
  readonly correctResult: ExecuteResult | null;
  readonly isDailyChallenge?: boolean;
  readonly choices?: readonly ChoiceItem[];
}

interface ChoiceCardStyle {
  readonly borderColor: string;
  readonly bgColor: string;
  readonly badgeText: string | null;
  readonly badgeStyle: React.CSSProperties;
}

/** 선택지 카드 상태(정답/내 선택/기타)에 따른 스타일 반환 */
function getChoiceCardStyle(isAnswer: boolean, isMyChoice: boolean): ChoiceCardStyle {
  if (isAnswer && isMyChoice) {
    return {
      borderColor: "var(--color-sem-success)",
      bgColor: "var(--color-sem-success-light)",
      badgeText: "정답 · 내 선택",
      badgeStyle: { backgroundColor: "var(--color-sem-success-light)", color: "var(--color-sem-success-text)" },
    };
  }
  if (isAnswer) {
    return {
      borderColor: "var(--color-sem-success)",
      bgColor: "var(--color-sem-success-light)",
      badgeText: "정답",
      badgeStyle: { backgroundColor: "var(--color-sem-success-light)", color: "var(--color-sem-success-text)" },
    };
  }
  if (isMyChoice) {
    return {
      borderColor: "var(--color-brand)",
      bgColor: "var(--color-brand-light)",
      badgeText: "내 선택",
      badgeStyle: { backgroundColor: "var(--color-brand-light)", color: "var(--color-brand)" },
    };
  }
  return {
    borderColor: "var(--color-border)",
    bgColor: "var(--color-surface-card)",
    badgeText: null,
    badgeStyle: {},
  };
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

  // 실행 중인 선택지 키 — useCallback deps에서 제거하기 위해 ref로 추적
  const executingKeyRef = useRef<string | null>(null);
  // 캐시 guard 조회용 ref — resultCache state와 동기화
  const resultCacheRef = useRef<Record<string, ExecuteResult>>({});

  // 선택지 SQL 실행 결과 캐시 — 제출 응답(selectedResult/correctResult)으로 초기화
  const [resultCache, setResultCache] = useState<Record<string, ExecuteResult>>(() => {
    if (!state) return {};
    const cache: Record<string, ExecuteResult> = {};
    if (state.selectedResult && state.selectedKey) {
      cache[state.selectedKey] = state.selectedResult;
      resultCacheRef.current[state.selectedKey] = state.selectedResult;
    }
    if (state.correctResult && state.correctKey) {
      cache[state.correctKey] = state.correctResult;
      resultCacheRef.current[state.correctKey] = state.correctResult;
    }
    return cache;
  });
  const [executing, setExecuting] = useState<string | null>(null);
  const [execErrors, setExecErrors] = useState<Record<string, string>>({});

  const handleExecute = useCallback(async (choice: ChoiceItem) => {
    // ref로 중복 실행 방지 — state 캡처 없이 최신 값 조회
    if (!state || resultCacheRef.current[choice.key] || executingKeyRef.current === choice.key) return;
    setExecErrors((prev) => { const next = { ...prev }; delete next[choice.key]; return next; });
    executingKeyRef.current = choice.key;
    setExecuting(choice.key);
    try {
      const result = await executeChoice(state.questionUuid, choice.body);
      resultCacheRef.current = { ...resultCacheRef.current, [choice.key]: result };
      setResultCache((prev) => ({ ...prev, [choice.key]: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "실행에 실패했습니다";
      setExecErrors((prev) => ({ ...prev, [choice.key]: message }));
    } finally {
      executingKeyRef.current = null;
      setExecuting(null);
    }
  }, [state]); // resultCache, executing deps 제거됨 — ref로 대체

  const handleAskAi = useCallback(() => {
    if (!state) return;
    setAiSheetOpen(true);
    setAiText("");
    diffMutation.mutate({
      questionUuid: state.questionUuid,
      selectedChoiceKey: state.selectedKey,
    });
  }, [state, diffMutation.mutate]);

  if (!state) {
    navigate("/questions", { replace: true });
    return null;
  }

  const {
    isCorrect,
    rationale,
    selectedSql,
    correctSql,
    executionMode,
    isDailyChallenge,
    choices,
    selectedKey,
    correctKey,
  } = state;

  const isExecutable = executionMode === "EXECUTABLE";
  const sqlChoices = isExecutable
    ? (choices ?? []).filter((c) => c.kind === "SQL")
    : [];

  // ── 정답/오답 헤더 ──────────────────────────────────────
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
          : "오답이에요. 해설을 확인해보세요"}
      </p>
    </div>
  );

  // ── CONCEPT_ONLY: 기존 텍스트 비교 카드 (변경 없음) ────
  const conceptSection = !isExecutable ? (
    <div className="card-base">
      {!isCorrect && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            backgroundColor: "var(--color-sem-error-light)",
            borderLeft: "4px solid var(--color-sem-error)",
          }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-sem-error-text)" }}>
            내가 선택한 답
          </p>
          {selectedSql && <p className="text-body text-sm">{selectedSql}</p>}
        </div>
      )}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--color-sem-success-light)",
          borderLeft: "4px solid var(--color-sem-success)",
        }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-sem-success-text)" }}>
          정답
        </p>
        {correctSql && <p className="text-body text-sm">{correctSql}</p>}
      </div>
    </div>
  ) : null;

  // ── 해설 카드 ────────────────────────────────────────────
  const rationaleSection = (
    <div className="card-base mt-4">
      <p className="text-secondary text-sm mb-2">해설</p>
      <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
        {rationale}
      </p>
      {!isCorrect && (
        <button className="btn-primary w-full mt-4" type="button" onClick={handleAskAi}>
          AI에게 자세히 물어보기
        </button>
      )}
    </div>
  );

  // ── EXECUTABLE: 선택지 카드 목록 ─────────────────────────
  const choiceListSection = isExecutable && sqlChoices.length > 0 ? (
    <section className="mt-6 space-y-3">
      <p className="text-secondary text-sm">SQL 실행 비교</p>
      {sqlChoices.map((choice) => {
        const isAnswer = choice.key === correctKey;
        const isMyChoice = choice.key === selectedKey;
        const cached = resultCache[choice.key];
        const isRunning = executing === choice.key;
        const error = execErrors[choice.key];

        // 카드 스타일 결정 — 정답/내선택/기타 3가지 상태
        const { borderColor, bgColor, badgeText, badgeStyle } = getChoiceCardStyle(isAnswer, isMyChoice);

        return (
          <div
            key={choice.key}
            className="rounded-xl p-4"
            style={{
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${borderColor}`,
            }}
          >
            {/* 선택지 키 + 상태 뱃지 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>
                {choice.key}
              </span>
              {badgeText && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={badgeStyle}>
                  {badgeText}
                </span>
              )}
            </div>

            {/* SQL 본문 */}
            <pre
              className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word mb-3"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
            >
              {choice.body}
            </pre>

            {/* 실행 버튼 또는 에러 */}
            {error ? (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm" style={{ color: "var(--color-sem-error)" }}>{error}</p>
                <button type="button" className="btn-compact" onClick={() => handleExecute(choice)}>
                  재시도
                </button>
              </div>
            ) : !cached ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-compact"
                  onClick={() => handleExecute(choice)}
                  disabled={isRunning}
                >
                  {isRunning ? "실행 중..." : "실행"}
                </button>
              </div>
            ) : null}

            {/* 실행 결과 */}
            {cached && <ResultTable result={cached} />}
          </div>
        );
      })}
    </section>
  ) : null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-180 w-full px-4 pb-24">
        {headerSection}
        {conceptSection}
        {rationaleSection}
        {choiceListSection}

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

      {/* fixed bottom 액션 버튼 */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page">
        <div className="mx-auto max-w-180 px-4 py-4">
          <button
            type="button"
            className="w-full h-12 rounded-xl text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => {
              if (isDailyChallenge) {
                // 데일리 챌린지: 정답이면 홈, 오답이면 다시 풀기
                navigate(isCorrect ? "/" : "/daily-challenge", { replace: true });
              } else {
                navigate("/questions");
              }
            }}
          >
            {isDailyChallenge
              ? isCorrect ? "홈으로 가기" : "다시 풀기"
              : "문제 목록으로"}
          </button>
        </div>
      </div>
    </div>
  );
}
