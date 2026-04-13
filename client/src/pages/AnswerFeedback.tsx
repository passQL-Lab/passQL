import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronRight, AlertCircle, RefreshCw, BookOpen, ChevronDown, FileText, GitCompare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import MarkdownText from "../components/MarkdownText";
import { executeChoice } from "../api/questions";
import { ResultTable } from "../components/ResultTable";
import { SchemaViewer } from "../components/SchemaViewer";
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
  readonly schemaDisplay?: string | null;
  readonly schemaDdl?: string | null;
  readonly schemaSampleData?: string | null;
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
      // text-success-content는 흰색이라 연초록 배경에서 안 보임 — 직접 초록 텍스트 지정
      badgeClass: "badge badge-sm border-0 bg-success/20 text-success",
      badgeText: "내 선택 · 정답",
    };
  }
  if (isAnswer) {
    return {
      cardClass: "acc-sql-card is-correct",
      badgeClass: "badge badge-sm border-0 bg-success/20 text-success",
      badgeText: "정답",
    };
  }
  if (isMyChoice) {
    return {
      cardClass: "acc-sql-card is-wrong",
      badgeClass: "badge badge-sm border-0 bg-error/20 text-error",
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

  // state 없으면 렌더 중 직접 navigate 대신 effect로 이동 — 렌더 중 side effect 방지
  useEffect(() => {
    if (!state) navigate("/questions", { replace: true });
  }, [state, navigate]);

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

  if (!state) return null;

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
    schemaDisplay,
    schemaDdl,
    schemaSampleData,
  } = state;

  const isExecutable = executionMode === "EXECUTABLE";

  // 정답 → 내 선택 → 나머지 순 정렬 — choices/키가 바뀔 때만 재계산
  const sqlChoices = useMemo(() => {
    if (!isExecutable) return [];
    return (choices ?? [])
      .filter((c) => c.kind === "SQL")
      .slice()
      .sort((a, b) => {
        const rank = (key: string) =>
          key === correctKey ? 0 : key === selectedKey ? 1 : 2;
        return rank(a.key) - rank(b.key);
      });
  }, [isExecutable, choices, correctKey, selectedKey]);

  // 미실행 선택지 전체 병렬 실행 — 이미 실행 중이거나 캐시된 항목은 guard로 자동 스킵
  const handleRunAll = useCallback(async () => {
    const unexecuted = sqlChoices.filter(
      (c) => !resultCacheRef.current[c.key] && !executingKeyRef.current.has(c.key)
    );
    await Promise.allSettled(unexecuted.map((c) => handleExecute(c)));
  }, [sqlChoices, handleExecute]);

  // ── 헤더: 상단 3px 컬러 바 + 도트 상태 eyebrow + 제목 ──
  const headerSection = (
    <div className="bg-base-100 border-b border-base-200 feedback-header-anim">
      {/* 상단 3px 컬러 바 — 좌→우 슬라이드인 */}
      <div
        className={`h-0.75 w-full feedback-bar-anim ${
          isCorrect ? "bg-success" : "bg-error"
        }`}
      />
      <div className="px-4 pt-4 pb-4">
        {/* 도트 + 상태 eyebrow */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className={`inline-block w-1.75 h-1.75 rounded-full shrink-0 ${
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
        <BookOpen size={13} className="text-base-content/60 shrink-0" />
        <span className="text-xs font-semibold text-base-content/60">문제 보기</span>
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
          {/* stem에 마크다운 테이블/코드 포함 가능 — components prop으로 스타일 적용 */}
          <ReactMarkdown
            components={{
              // 단일 \n도 시각적으로 줄바꿈 되도록 whitespace-pre-line 적용
              p({ children }) {
                return (
                  <p className="text-sm text-base-content leading-relaxed mb-2 whitespace-pre-line">
                    {children}
                  </p>
                );
              },
              code({ children, className }) {
                const isBlock = className?.includes("language-");
                return isBlock ? (
                  <pre className="bg-surface-code rounded-lg px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-surface-code px-1 rounded text-xs font-mono">
                    {children}
                  </code>
                );
              },
              table({ children }) {
                // 마크다운 테이블을 스크롤 가능한 컨테이너로 감쌈
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">{children}</table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-border px-2 py-1 bg-surface-code text-left font-semibold text-text-secondary">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-border px-2 py-1 font-mono text-text-primary">
                    {children}
                  </td>
                );
              },
            }}
          >
            {stem}
          </ReactMarkdown>
          {/* 스키마가 있으면 stem 아래에 표시 — schemaDisplay 없어도 schemaDdl로 폴백 */}
          {(schemaDisplay || schemaDdl) && (
            <div className="mt-3">
              <SchemaViewer
                schemaDisplay={schemaDisplay ?? undefined}
                schemaDdl={schemaDdl ?? undefined}
                schemaSampleData={schemaSampleData ?? undefined}
              />
            </div>
          )}
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

  // ── 해설 카드 — acc-sql-card와 동일한 10px 라운드로 통일 ──
  const rationaleSection = (
    <div className="rationale-card feedback-card-anim-2">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText size={13} className="text-base-content/60 shrink-0" />
        <p className="text-xs text-base-content/60 uppercase tracking-widest font-semibold">해설</p>
      </div>
      <MarkdownText text={rationale} className="text-sm text-base-content leading-relaxed" />
    </div>
  );

  // ── EXECUTABLE: SQL 아코디언 비교 섹션 ──
  const choiceListSection = isExecutable && sqlChoices.length > 0 ? (
    <section className="space-y-2 feedback-card-anim-3">
      {/* 섹션 헤더: 레이블 + 모두 실행 버튼 */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <GitCompare size={13} className="text-base-content/60 shrink-0" />
          <p className="text-xs text-base-content/60 uppercase tracking-widest font-semibold">
            SQL 실행 비교
          </p>
        </div>
        <button
          type="button"
          className="btn-run-all"
          onClick={handleRunAll}
        >
          {/* Play 아이콘 — lucide Play가 fill 미지원이므로 SVG 직접 사용 */}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          모두 실행하기
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
              {/* 뱃지 (정답/내 선택만 표시, 나머지는 없음) — 열림/닫힘 모두 표시 */}
              {badgeText && (
                <span className={`${badgeClass} shrink-0`}>{badgeText}</span>
              )}

              {/* SQL 미리보기 — 항상 표시 (열려도 컨텍스트 유지) */}
              <span className="acc-sql-preview">{choice.body}</span>

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
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap wrap-break-word mb-3 text-base-content bg-base-200 rounded-lg p-3">
                  {choice.body}
                </pre>

                {/* 실행 에러 */}
                {error ? (
                  <div className="error-card mt-2 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                      <p className="text-sm text-error leading-snug wrap-break-word">{error}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-run-all shrink-0"
                      onClick={() => handleExecute(choice)}
                    >
                      <RefreshCw size={8} />
                      재시도
                    </button>
                  </div>
                ) : !cached ? (
                  /* 미실행 — 개별 실행 버튼 (btn-run-all과 동일 스타일) */
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-run-all"
                      onClick={() => handleExecute(choice)}
                      disabled={isRunning}
                    >
                      {!isRunning && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      {isRunning ? "실행 중…" : "쿼리 실행"}
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
                  <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-body truncate">{q.stem}</p>
                      <span className="badge-topic">{q.topicName}</span>
                    </div>
                    <ChevronRight size={16} className="text-text-caption shrink-0" />
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
