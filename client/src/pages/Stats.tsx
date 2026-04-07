import { ChevronRight } from "lucide-react";

const MOCK_TOPICS = [
  { name: "JOIN", rate: 85 },
  { name: "서브쿼리", rate: 42 },
  { name: "GROUP BY", rate: 91 },
  { name: "DDL", rate: 35 },
  { name: "DML", rate: 68 },
  { name: "제약조건", rate: 55 },
  { name: "인덱스", rate: 28 },
  { name: "윈도우함수", rate: 12 },
  { name: "WHERE", rate: 78 },
  { name: "ORDER BY", rate: 95 },
] as const;

const MOCK_WRONG = [
  { id: "Q015", stem: "INNER JOIN과 LEFT JOIN의 차이를 올바르게 설명한 것은?", topic: "JOIN", ago: "2일 전" },
  { id: "Q023", stem: "서브쿼리에서 EXISTS와 IN의 성능 차이는?", topic: "서브쿼리", ago: "3일 전" },
  { id: "Q031", stem: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?", topic: "GROUP BY", ago: "5일 전" },
  { id: "Q008", stem: "CREATE TABLE 시 DEFAULT 제약조건 문법은?", topic: "DDL", ago: "1주 전" },
] as const;

function getHeatmapStyle(rate: number): { bg: string; text: string } {
  if (rate >= 86) return { bg: "#4F46E5", text: "#FFFFFF" };
  if (rate >= 71) return { bg: "#818CF8", text: "#FFFFFF" };
  if (rate >= 51) return { bg: "#C7D2FE", text: "#4F46E5" };
  if (rate >= 31) return { bg: "#EEF2FF", text: "#4F46E5" };
  return { bg: "#F5F5F5", text: "#6B7280" };
}

export default function Stats() {
  return (
    <div className="py-6 space-y-6">
      {/* 1. Summary metrics */}
      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: "42", label: "푼 문제" },
          { value: "68%", label: "정답률" },
          { value: "3일", label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* 2. Topic Mastery Heatmap */}
      <section>
        <h2 className="text-h2 mb-4">토픽별 숙련도</h2>
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
          {MOCK_TOPICS.map((t) => {
            const style = getHeatmapStyle(t.rate);
            return (
              <div
                key={t.name}
                className="rounded-lg min-h-[48px] flex flex-col items-center justify-center py-2 px-1"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                <span className="text-[13px] font-bold">{t.name}</span>
                <span className="text-xs">{t.rate}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 최근 틀린 문제 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2">최근 틀린 문제</h2>
          <button className="text-brand text-sm font-medium" type="button">더 보기</button>
        </div>
        <div className="card-base p-0 divide-y divide-border">
          {MOCK_WRONG.map((q) => (
            <div key={q.id} className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-surface transition-colors">
              <span className="font-mono text-xs text-text-caption flex-shrink-0">{q.id}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-text-primary truncate">{q.stem}</p>
                <span className="badge-topic mt-1">{q.topic}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-caption text-xs">{q.ago}</span>
                <ChevronRight size={16} className="text-text-caption" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
