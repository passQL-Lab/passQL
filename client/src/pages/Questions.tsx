import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight, ChevronDown } from "lucide-react";
import { useQuestions } from "../hooks/useQuestions";
import { useTopics } from "../hooks/useTopics";

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? "fill-[var(--color-sem-warning)] text-[var(--color-sem-warning)]" : "text-border"}
        />
      ))}
    </span>
  );
}

export default function Questions() {
  const [page, setPage] = useState(0);
  const [topic, setTopic] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<number | undefined>();
  const [topicOpen, setTopicOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: topics } = useTopics();
  const { data, isLoading } = useQuestions({ page, size: 10, topic, difficulty });

  return (
    <div className="py-6 space-y-0">
      {/* 1. Filter bar */}
      <section className="flex gap-3 mb-4 relative">
        <div className="relative">
          <button
            className={`filter-dropdown ${topic ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => { setTopicOpen(!topicOpen); setDiffOpen(false); }}
          >
            {topics?.find((t) => t.code === topic)?.displayName ?? "토픽"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {topicOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                onClick={() => { setTopic(undefined); setTopicOpen(false); setPage(0); }}
              >
                전체
              </button>
              {topics?.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface"
                  onClick={() => { setTopic(t.code); setTopicOpen(false); setPage(0); }}
                >
                  {t.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className={`filter-dropdown ${difficulty ? "filter-dropdown--active" : ""}`}
            type="button"
            onClick={() => { setDiffOpen(!diffOpen); setTopicOpen(false); }}
          >
            {difficulty ? `난이도 ${difficulty}` : "난이도"} <ChevronDown size={14} className="text-text-caption inline" />
          </button>
          {diffOpen && (
            <div className="absolute top-full mt-1 left-0 bg-surface-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
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
                  {"★".repeat(d)}{"☆".repeat(3 - d)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Result count */}
      <p className="text-secondary mb-4">
        {isLoading ? "로딩 중..." : `${data?.totalElements ?? 0}문제`}
      </p>

      {/* 3. Question card list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="card-base h-24 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          {data?.content.map((q) => (
            <Link key={q.id} to={`/questions/${q.id}`}>
              <div className="card-base flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-caption">Q{String(q.id).padStart(3, "0")}</span>
                  <span className="badge-topic">{q.topicCode}</span>
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

      {/* 4. Pagination */}
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
