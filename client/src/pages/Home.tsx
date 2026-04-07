export default function Home() {
  return (
    <div className="bg-surface min-h-screen p-8">
      {/* Typography */}
      <h1 className="text-display-md text-text-primary">passQL</h1>
      <h2 className="text-headline-sm text-text-primary mt-4">SQL 자격증 학습</h2>
      <p className="text-body-lg text-text-secondary mt-2">
        논리적 사고로 SQL을 마스터하세요.
      </p>
      <span className="text-label-md text-text-muted mt-2 block">난이도: 중급</span>

      {/* Surface Cards */}
      <div className="bg-surface-card rounded-box mt-8 p-6">
        <h3 className="text-title-md">Surface Card (#fff on #f9f9f9)</h3>
      </div>

      {/* Code Block */}
      <pre className="sql-code-block mt-8">
        <code>{"SELECT u.name, COUNT(*) AS total\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.name;"}</code>
      </pre>

      {/* Semantic Cards */}
      <div className="mt-8 space-y-3">
        <div className="semantic-card semantic-card--success">정답입니다!</div>
        <div className="semantic-card semantic-card--error">오답입니다. 다시 시도하세요.</div>
      </div>

      {/* Pill Filters */}
      <div className="mt-8 flex gap-2">
        <button className="pill-filter pill-filter--active" type="button">전체</button>
        <button className="pill-filter" type="button">SELECT</button>
        <button className="pill-filter" type="button">JOIN</button>
        <button className="pill-filter" type="button">서브쿼리</button>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-3">
        <button className="btn btn-primary h-11" type="button">제출하기</button>
        <button className="btn bg-surface-active text-text-primary font-mono h-8 min-h-8 text-sm" type="button">
          실행
        </button>
      </div>

      {/* Toast Preview */}
      <div className="toast-passql mt-8 inline-block">
        답안이 저장되었습니다.
      </div>
    </div>
  );
}
