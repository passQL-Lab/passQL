import { Star } from "lucide-react";

const MOCK_QUESTIONS = [
  { id: "Q001", topic: "JOIN", stem: "고객별 주문 수를 구하는 올바른 SQL은?", difficulty: 2 },
  { id: "Q002", topic: "서브쿼리", stem: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?", difficulty: 3 },
  { id: "Q003", topic: "GROUP BY", stem: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?", difficulty: 2 },
  { id: "Q004", topic: "DDL", stem: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?", difficulty: 1 },
  { id: "Q005", topic: "제약조건", stem: "NOT NULL과 UNIQUE 제약조건의 차이를 올바르게 설명한 것은?", difficulty: 3 },
] as const;

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
  return (
    <div className="py-6 space-y-0">
      {/* 1. Filter bar */}
      <section className="flex gap-3 mb-4">
        <button className="filter-dropdown" type="button">
          토픽 <span className="text-text-caption">▼</span>
        </button>
        <button className="filter-dropdown" type="button">
          난이도 <span className="text-text-caption">▼</span>
        </button>
      </section>

      {/* 2. Result count */}
      <p className="text-secondary mb-4">{MOCK_QUESTIONS.length}문제</p>

      {/* 3. Question card list */}
      <section className="space-y-3">
        {MOCK_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="card-base flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors"
          >
            {/* Top row: Q번호 + 토픽 pill */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-text-caption">{q.id}</span>
              <span className="badge-topic">{q.topic}</span>
            </div>

            {/* Middle: stem preview */}
            <p className="text-body truncate">{q.stem}</p>

            {/* Bottom row: difficulty + chevron */}
            <div className="flex items-center justify-between">
              <StarRating level={q.difficulty} />
              <span className="text-text-caption">›</span>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Pagination */}
      <div className="flex justify-center pt-6">
        <button className="text-brand text-sm font-medium hover:underline" type="button">
          더 보기
        </button>
      </div>
    </div>
  );
}
