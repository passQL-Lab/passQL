// Mock data — API 연동 시 교체
const MOCK_NICKNAME = "용감한 판다";
const MOCK_INITIALS = "용판";
const MOCK_TODAY_QUESTION = "고객별 주문 수를 구하는 올바른 SQL은?";
const MOCK_STREAK = 3;
const MOCK_SOLVED = 42;
const MOCK_CORRECT_RATE = 68;

export default function Home() {
  return (
    <div className="py-6 space-y-0">
      {/* 1. Greeting */}
      <section className="flex items-center gap-3 mb-8">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {MOCK_INITIALS}
        </div>
        <h1 className="text-h2">안녕하세요, {MOCK_NICKNAME}</h1>
      </section>

      {/* 2. 오늘의 문제 */}
      <section className="mb-4">
        <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-secondary mb-1">오늘의 문제</p>
            <p className="text-body truncate">{MOCK_TODAY_QUESTION}</p>
          </div>
          <span className="text-text-caption text-lg flex-shrink-0">›</span>
        </div>
      </section>

      {/* 3. 스트릭 뱃지 */}
      <section className="mb-6">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
          style={{
            backgroundColor: "var(--color-sem-warning-light)",
            color: "var(--color-sem-warning-text)",
          }}
        >
          🔥 연속 {MOCK_STREAK}일
        </span>
      </section>

      {/* 4. 통계 카드 2개 */}
      <section className="grid grid-cols-2 gap-3">
        {/* 푼 문제 */}
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{MOCK_SOLVED}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>

        {/* 정답률 */}
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{MOCK_CORRECT_RATE}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${MOCK_CORRECT_RATE}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
