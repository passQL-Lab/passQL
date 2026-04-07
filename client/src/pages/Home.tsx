export default function Home() {
  return (
    <div className="py-6 space-y-6">
      {/* Typography */}
      <h1 className="text-h1">passQL</h1>
      <h2 className="text-h2 mt-4">SQL 자격증 학습</h2>
      <p className="text-body">논리적 사고로 SQL을 마스터하세요.</p>
      <span className="text-caption block">난이도: 중급</span>

      {/* Card */}
      <div className="card-base">
        <h3 className="text-h2">Card Component</h3>
        <p className="text-secondary mt-2">12px radius, 1px #E5E7EB border, white bg</p>
      </div>

      {/* Code Block */}
      <pre className="code-block">
        <code>{"SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name;"}</code>
      </pre>

      {/* Badges */}
      <div className="flex gap-2">
        <span className="badge-topic">JOIN</span>
        <span className="badge-topic">GROUP BY</span>
        <span className="badge-topic">서브쿼리</span>
      </div>

      {/* Semantic Cards */}
      <div className="space-y-3">
        <div className="success-card">
          <span className="text-secondary" style={{ color: "var(--color-sem-success-text)" }}>✓ 3행 · 34ms</span>
        </div>
        <div className="error-card">
          <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>⚠ SQL_SYNTAX</span>
          <p className="text-secondary mt-1">Unknown column 'o.cust_id' in 'on clause'</p>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3">
        <button className="filter-dropdown filter-dropdown--active" type="button">토픽 ▼</button>
        <button className="filter-dropdown" type="button">난이도 ▼</button>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button className="btn-primary" type="button">제출하기</button>
        <button className="btn-secondary" type="button">다음 문제</button>
        <button className="btn-compact" type="button">실행</button>
        <button className="btn-primary" type="button" disabled>비활성</button>
      </div>

      {/* Radio */}
      <div className="flex gap-4 items-center">
        <div className="radio-custom radio-custom--selected" />
        <span className="text-body">선택됨</span>
        <div className="radio-custom" />
        <span className="text-body">미선택</span>
      </div>

      {/* Toast Preview */}
      <div className="relative">
        <div className="toast-passql static transform-none inline-block">답안이 저장되었습니다.</div>
      </div>
    </div>
  );
}
