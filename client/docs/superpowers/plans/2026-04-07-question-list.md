# Question List Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prompt2_QuestionList.md 스펙대로 문제 목록 화면 UI를 mock 데이터 기반으로 구현한다.

**Architecture:** Questions.tsx를 3개 섹션(FilterBar, ResultCount, QuestionCardList + Pagination)으로 구성한다. mock 데이터로 5개 문제 카드를 렌더링하고, 필터 dropdown은 시각적으로만 구현한다(동작은 API 연동 시).

**Tech Stack:** React 19, Tailwind CSS 4 tokens, 기존 디자인 시스템 CSS 클래스

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Rewrite | `src/pages/Questions.tsx` | 문제 목록 화면 전체 (필터, 카드 리스트, 페이지네이션) |

---

### Task 1: Questions 페이지 구현

**Files:**
- Rewrite: `src/pages/Questions.tsx`

- [ ] **Step 1: Questions.tsx 전체 교체**

Prompt2 스펙의 4개 섹션:
1. Filter bar (토픽/난이도 pill dropdown)
2. Result count ("23문제")
3. Question card list (5개, 각기 다른 토픽/난이도)
4. Pagination ("더 보기" 텍스트 버튼)

```tsx
const MOCK_QUESTIONS = [
  { id: "Q001", topic: "JOIN", stem: "고객별 주문 수를 구하는 올바른 SQL은?", difficulty: 2 },
  { id: "Q002", topic: "서브쿼리", stem: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?", difficulty: 3 },
  { id: "Q003", topic: "GROUP BY", stem: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?", difficulty: 2 },
  { id: "Q004", topic: "DDL", stem: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?", difficulty: 1 },
  { id: "Q005", topic: "제약조건", stem: "NOT NULL과 UNIQUE 제약조건의 차이를 올바르게 설명한 것은?", difficulty: 3 },
] as const;

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="text-sm tracking-wide" style={{ color: "var(--color-sem-warning)" }}>
      {"★".repeat(level)}
      {"☆".repeat(3 - level)}
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
```

**스펙 체크리스트:**
- ✅ Filter bar: 2개 pill dropdown ("토픽 ▼", "난이도 ▼"), rounded-full, 1px #E5E7EB border, 40px height, 14px, chevron #9CA3AF
- ✅ Result count: "5문제" Pretendard 14px #6B7280 (text-secondary)
- ✅ Card: 12px radius, 1px #E5E7EB border, 20px padding (card-base)
- ✅ Top row: "Q001" JetBrains Mono 12px #9CA3AF (font-mono text-xs text-text-caption) + topic pill #EEF2FF/#4F46E5 (badge-topic)
- ✅ Middle: stem 16px #111827 (text-body), 1 line truncated
- ✅ Bottom row: difficulty stars ★★☆ #F59E0B + chevron #9CA3AF
- ✅ Hover: subtle #FAFAFA background (hover:bg-surface)
- ✅ Pagination: "더 보기" text button #4F46E5 14px, centered
- ✅ 5 cards with varying topics (JOIN, 서브쿼리, GROUP BY, DDL, 제약조건) and difficulties
- ✅ Korean text throughout

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Questions.tsx
git commit -m "feat: 문제 목록 화면 UI 구현 (mock 데이터) #9"
```
