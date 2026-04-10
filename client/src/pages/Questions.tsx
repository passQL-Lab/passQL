import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";
import { useQuestions } from "../hooks/useQuestions";
import { useTopics } from "../hooks/useTopics";
import { StarRating } from "../components/StarRating";
import ErrorFallback from "../components/ErrorFallback";

export default function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topic = searchParams.get("topic") ?? undefined;

  const [page, setPage] = useState(0);
  const [difficulty, setDifficulty] = useState<number | undefined>();
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: topics, isLoading: topicsLoading, isError: topicsError } = useTopics();
  const { data, isLoading, isError, refetch } = useQuestions(
    topic !== undefined ? { page, size: 10, topic, difficulty } : { page: 0, size: 0 },
  );

  function selectTopic(code: string) {
    setPage(0);
    setDifficulty(undefined);
    setSearchParams({ topic: code });
  }

  function clearTopic() {
    setPage(0);
    setDifficulty(undefined);
    setSearchParams({});
  }

  // 카테고리 그리드 뷰
  if (topic === undefined) {
    return (
      <div className="py-6 space-y-4">
        <h1 className="text-h1">문제</h1>
        <p className="text-secondary">토픽을 선택하세요</p>

        {topicsError ? (
          <ErrorFallback onRetry={() => window.location.reload()} />
        ) : topicsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="card-base h-20 animate-pulse bg-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {topics
              ?.filter((t) => t.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="card-base flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors text-left"
                  onClick={() => selectTopic(t.code)}
                >
                  <span className="text-body font-medium text-text-primary">{t.displayName}</span>
                  {t.subtopics.length > 0 && (
                    <span className="text-caption text-text-caption">
                      {t.subtopics.length}개 서브토픽
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    );
  }

  // 문제 목록 뷰
  const currentTopic = topics?.find((t) => t.code === topic);

  return (
    <div className="py-6 space-y-0">
      {/* Back to categories */}
      <button
        type="button"
        className="flex items-center gap-1 text-brand text-sm font-medium mb-4 hover:underline"
        onClick={clearTopic}
      >
        <ArrowLeft size={14} />
        토픽 전체
      </button>

      <h1 className="text-h1 mb-4">
        {currentTopic?.displayName ?? topic}
      </h1>

      {/* Filter bar */}
      <section className="flex gap-3 mb-4 relative">
        <div className="relative">
          <button
            className={`filter-dropdown ${difficulty ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => setDiffOpen(!diffOpen)}
          >
            {difficulty ? `난이도 ${difficulty}` : "난이도"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {diffOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg z-10 py-1 min-w-[120px]">
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                onClick={() => { setDifficulty(undefined); setDiffOpen(false); setPage(0); }}
              >
                전체
              </button>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                  onClick={() => { setDifficulty(d); setDiffOpen(false); setPage(0); }}
                >
                  <StarRating level={d} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Result count */}
      <p className="text-secondary mb-4">
        {isLoading ? "로딩 중..." : `${data?.totalElements ?? 0}문제`}
      </p>

      {/* Question card list */}
      {isError ? (
        <ErrorFallback onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-base h-24 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          {data?.content.map((q) => (
            <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`} className="block">
              <div className="card-base flex flex-col gap-3 cursor-pointer hover:bg-surface transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-caption">{q.questionUuid.slice(0, 8)}</span>
                  <span className="badge-topic">{q.topicName}</span>
                </div>
                <p className="text-body truncate">{q.stemPreview}</p>
                <div className="flex items-center justify-between">
                  <StarRating level={q.difficulty} />
                  <ChevronRight size={16} className="text-text-caption" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Pagination */}
      {data && !data.last && (
        <div className="flex justify-center pt-6">
          <button
            className="text-brand text-sm font-medium hover:underline"
            type="button"
            onClick={() => setPage((p) => p + 1)}
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
