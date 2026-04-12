import { useState, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronRight, AlertCircle, RefreshCw, BookOpen, ChevronDown } from "lucide-react";
import { executeChoice } from "../api/questions";
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
  // 결과 화면 상단 문제 보기 토글용
  readonly stem?: string;
  readonly topicName?: string;
}

/** EXECUTABLE 선택지 카드 상태에 따른 클래스 반환 — A/B/C/D 키 레이블 없이 뱃지로만 구분 */
function getChoiceCardClass(isAnswer: boolean, isMyChoice: boolean): {
  cardClass: string;
  badgeClass: string;
  badgeText: string | null;
} {
  if (isAnswer && isMyChoice) {
    return {
      cardClass: "acc-sql-card is-correct",
      badgeClass: "badge badge-sm bg-success/20 text-success-content border-0",
      badgeText: "내 선택 · 정답",
    };
  }
  if (isAnswer) {
    return {
      cardClass: "acc-sql-card is-correct",
      badgeClass: "badge badge-sm bg-success/20 text-success-content border-0",
      badgeText: "정답",
    };
  }
  if (isMyChoice) {
    return {
      cardClass: "acc-sql-card is-wrong",
      badgeClass: "badge badge-sm bg-error/20 text-error border-0",
      badgeText: "내 선택",
    };
  }
  return {
    cardClass: "acc-sql-card",
    badgeClass: "",
    badgeText: null,
  };
}

export default function AnswerFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as FeedbackState | null;

  // 문제 보기 토글 열림 상태
  const [stemOpen, setStemOpen] = useState(false);

  // 아코디언 열림 상태 — 내 선택/정답 카드는 기본 펼침
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    if (!state) return new Set();
    const defaultOpen = new Set<string>();
    if (state.selectedKey) defaultOpen.add(state.selectedKey);
    if (state.correctKey) defaultOpen.add(state.correctKey);
    return defaultOpen;
  });

  const similarQuery = useSimilarQuestions(state?.questionUuid ?? "");

  // 실행 중인 선택지 키 Set — 병렬 실행 시 각 카드의 로딩 상태를 독립적으로 관리
  const executingKeyRef = useRef<Set<string>>(new Set());
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
  const [executing, setExecuting] = useState<Set<string>>(new Set());
  const [execErrors, setExecErrors] = useState<Record<string, string>>({});

  const toggleOpen = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleExecute = useCallback(async (choice: ChoiceItem) => {
    if (!state || resultCacheRef.current[choice.key] || executingKeyRef.current.has(choice.key)) return;
    setExecErrors((prev) => { const next = { ...prev }; delete next[choice.key]; return next; });
    executingKeyRef.current.add(choice.key);
    setExecuting((prev) => new Set([...prev, choice.key]));
    try {
      const result = await executeChoice(state.questionUuid, choice.body);
      resultCacheRef.current = { ...resultCacheRef.current, [choice.key]: result };
      setResultCache((prev) => ({ ...prev, [choice.key]: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "실행에 실패했습니다";
      setExecErrors((prev) => ({ ...prev, [choice.key]: message }));
    } finally {
      executingKeyRef.current.delete(choice.key);
      setExecuting((prev) => { const next = new Set(prev); next.delete(choice.key); return next; });
    }
  }, [state]);

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
    stem,
    topicName,
  } = state;

  const isExecutable = executionMode === "EXECUTABLE";
  const sqlChoices = isExecutable
    ? (choices ?? []).filter((c) => c.kind === "SQL")
    : [];

  // 미실행 선택지 전체 병렬 실행 — 이미 실행 중이거나 캐시된 항목은 guard로 자동 스킵
  const handleRunAll = async () => {
    const unexecuted = sqlChoices.filter(
      (c) => !resultCacheRef.current[c.key] && !executingKeyRef.current.has(c.key)
    );
    await Promise.allSettled(unexecuted.map((c) => handleExecute(c)));
  };

  // ── 헤더: 상단 3px 컬러 바 + 도트 상태 eyebrow + 제목 ──
  const headerSection = (
    <div className="bg-base-100 border-b border-base-200 feedback-header-anim">
      {/* 상단 3px 컬러 바 — 좌→우 슬라이드인 */}
      <div
        className={`h-[3px] w-full feedback-bar-anim ${
          isCorrect ? "bg-success" : "bg-error"
        }`}
      />
      <div className="px-4 pt-4 pb-4">
        {/* 도트 + 상태 eyebrow */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className={`inline-block w-[7px] h-[7px] rounded-full shrink-0 ${
              isCorrect ? "bg-success" : "bg-error"
            }`}
          />
          <span
            className={`text-xs font-semibold tracking-wide ${
              isCorrect ? "text-success" : "text-error"
            }`}
          >
            {isCorrect ? "정답" : "오답"}
          </span>
        </div>
        {/* 큰 제목 */}
        <h1 className="text-xl font-bold text-base-content">
          {isCorrect ? "맞혔어요!" : "틀렸어요"}
        </h1>
        {/* 부제목 */}
        <p className="text-sm text-base-content/50 mt-1">
          {isCorrect
            ? "잘 맞혔어요. 다음 문제도 도전해보세요"
            : "해설을 확인하고 다시 도전해보세요"}
        </p>
      </div>
    </div>
  );

  // ── 문제 보기 토글 카드 — stem이 없으면 렌더링하지 않음 ──
  const stemToggleSection = stem ? (
    <div
      className="stem-toggle-card feedback-card-anim-1"
      onClick={() => setStemOpen((v) => !v)}
    >
      <div className="stem-toggle-header">
        <BookOpen size={13} className="text-base-content/50 shrink-0" />
        <span className="text-xs font-semibold text-base-content/50">문제 보기</span>
        {/* 접혀있을 때 지문 첫 줄 미리보기 */}
        {!stemOpen && (
          <span className="stem-toggle-preview">{stem}</span>
        )}
        <ChevronDown
          size={13}
          className={`text-base-content/30 shrink-0 ml-auto transition-transform duration-200 ${stemOpen ? "rotate-180" : ""}`}
        />
      </div>
      {stemOpen && (
        <div className="stem-toggle-body" onClick={(e) => e.stopPropagation()}>
          {topicName && (
            <span className="badge-topic mb-2 inline-block">{topicName}</span>
          )}
          <p className="text-sm text-base-content leading-relaxed">{stem}</p>
        </div>
      )}
    </div>
  ) : null;

  // ── CONCEPT_ONLY: 선택한 답 + 정답 카드 ──
  const selectedBody =
    selectedSql ?? choices?.find((c) => c.key === selectedKey)?.body ?? null;
  const correctBody =
    correctSql ?? choices?.find((c) => c.key === correctKey)?.body ?? null;

  const conceptSection = !isExecutable ? (
    <div className="space-y-2 feedback-card-anim-2">
      {!isCorrect && selectedBody && (
        <div className="ans-card-wrong">
          <p className="text-xs font-semibold uppercase tracking-widest text-error/70 mb-1.5">
            내가 선택한 답
          </p>
          <p className="text-sm text-base-content leading-relaxed">{selectedBody}</p>
        </div>
      )}
      {correctBody && (
        <div className="ans-card-correct">
          <p className="text-xs font-semibold uppercase tracking-widest text-success/70 mb-1.5">
            {isCorrect ? "내가 선택한 답 · 정답" : "정답"}
          </p>
          <p className="text-sm text-base-content leading-relaxed">{correctBody}</p>
        </div>
      )}
    </div>
  ) : null;

  // ── 해설 카드 ──
  const rationaleSection = (
    <div className="card-base feedback-card-anim-2">
      <p className="text-xs text-base-content/40 mb-2 uppercase tracking-widest font-medium">해설</p>
      <p className="text-sm text-base-content leading-relaxed">{rationale}</p>
    </div>
  );

  // ── EXECUTABLE: SQL 아코디언 비교 섹션 ──
  const choiceListSection = isExecutable && sqlChoices.length > 0 ? (
    <section className="space-y-2 feedback-card-anim-3">
      {/* 섹션 헤더: 레이블 + 모두 실행 버튼 */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-base-content/40 uppercase tracking-widest font-medium">
          SQL 실행 비교
        </p>
        <button
          type="button"
          className="btn-run-all"
          onClick={handleRunAll}
        >
          {/* Play 아이콘 — lucide Play가 fill 미지원이므로 SVG 직접 사용 */}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          모두 실행
        </button>
      </div>

      {/* 선택지 아코디언 목록 */}
      {sqlChoices.map((choice) => {
        const isAnswer = choice.key === correctKey;
        const isMyChoice = choice.key === selectedKey;
        const cached = resultCache[choice.key];
        const isRunning = executing.has(choice.key);
        const error = execErrors[choice.key];
        const isOpen = openKeys.has(choice.key);
        const { cardClass, badgeClass, badgeText } = getChoiceCardClass(isAnswer, isMyChoice);

        return (
          <div key={choice.key} className={cardClass}>
            {/* 아코디언 헤더 — 클릭으로 열기/닫기 */}
            <div
              className="acc-sql-header"
              onClick={() => toggleOpen(choice.key)}
            >
              {/* 뱃지 (정답/내 선택만 표시, 나머지는 없음) */}
              {badgeText && (
                <span className={`${badgeClass} shrink-0`}>{badgeText}</span>
              )}

              {/* SQL 미리보기 — 닫혀 있을 때만 표시 */}
              {!isOpen && (
                <span className="acc-sql-preview">{choice.body}</span>
              )}

              {/* 행수 pill — 캐시 있고 닫혀있을 때 */}
              {!isOpen && cached && !cached.errorCode && (
                <span className="row-count-pill">{cached.rows?.length ?? 0}행</span>
              )}

              {/* 실행 중 인디케이터 */}
              {isRunning && (
                <span className="text-xs text-base-content/40 shrink-0">실행 중…</span>
              )}

              <ChevronDown
                size={13}
                className={`text-base-content/30 shrink-0 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>

            {/* 아코디언 바디 — 열렸을 때만 표시 */}
            {isOpen && (
              <div className="acc-sql-body">
                {/* SQL 본문 코드 블록 */}
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words mb-3 text-base-content bg-base-200 rounded-lg p-3">
                  {choice.body}
                </pre>

                {/* 실행 에러 */}
                {error ? (
                  <div className="error-card mt-2 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                      <p className="text-sm text-error leading-snug break-words">{error}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-compact inline-flex items-center gap-1.5 shrink-0"
                      onClick={() => handleExecute(choice)}
                    >
                      <RefreshCw size={12} />
                      재시도
                    </button>
                  </div>
                ) : !cached ? (
                  /* 미실행 — 개별 실행 버튼 */
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-compact inline-flex items-center gap-1.5"
                      onClick={() => handleExecute(choice)}
                      disabled={isRunning}
                    >
                      {isRunning ? "실행 중…" : "실행"}
                    </button>
                  </div>
                ) : null}

                {/* 실행 결과 테이블 */}
                {cached && <ResultTable result={cached} />}
              </div>
            )}
          </div>
        );
      })}
    </section>
  ) : null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* 헤더 — 최상단 고정 영역 */}
      {headerSection}

      <div className="flex-1 mx-auto max-w-180 w-full px-4 pt-4 pb-24 space-y-3">
        {/* 문제 보기 토글 — stem이 있을 때만 표시 */}
        {stemToggleSection}
        {conceptSection}
        {rationaleSection}
        {choiceListSection}

        {/* 유사 문제 */}
        {similarQuery.data && similarQuery.data.length > 0 && (
          <section className="feedback-card-anim-4">
            <p className="text-xs text-base-content/40 uppercase tracking-widest font-medium mb-2">유사 문제</p>
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

      {/* fixed bottom 버튼 — 항상 인디고(btn-primary) */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page">
        <div className="mx-auto max-w-180 px-4 py-4">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              if (isDailyChallenge) {
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
