import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const MOCK_CORRECT = {
  selectedKey: "A",
  correctKey: "A",
  sql: `SELECT c.name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY c.name`,
  rationale:
    "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다.",
  tags: ["JOIN", "GROUP BY", "집계함수"],
};

const MOCK_WRONG = {
  selectedKey: "C",
  correctKey: "A",
  selectedSql: `SELECT name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY name`,
  correctSql: `SELECT c.name, COUNT(*) AS cnt
FROM CUSTOMER c
JOIN ORDERS o ON c.id = o.customer_id
GROUP BY c.name`,
  whyWrong: "GROUP BY 절에서 별칭 사용이 표준 SQL에서 지원되지 않습니다.",
  whyCorrect:
    "테이블 별칭을 명시하여 c.name으로 GROUP BY하면 정확한 결과를 얻을 수 있습니다.",
};

function CorrectVersion() {
  return (
    <>
      <div className="text-center pt-12 pb-8">
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
          style={{ backgroundColor: "#DCFCE7" }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-success-text)" }}>
          정답입니다!
        </h1>
        <p className="text-secondary mt-2">잘했어요! 다음 문제도 도전해보세요</p>
      </div>

      <div className="card-base">
        <p className="text-secondary text-sm mb-3">해설</p>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
            style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
          >
            {MOCK_CORRECT.selectedKey}
          </span>
        </div>
        <pre
          className="rounded-lg p-4 text-sm font-mono leading-relaxed mb-4"
          style={{
            backgroundColor: "var(--color-sem-success-light)",
            borderLeft: "4px solid var(--color-sem-success)",
          }}
        >
          <code>{MOCK_CORRECT.sql}</code>
        </pre>
        <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
          {MOCK_CORRECT.rationale}
        </p>
        <div className="flex gap-2 mt-4">
          {MOCK_CORRECT.tags.map((tag) => (
            <span key={tag} className="badge-topic">{tag}</span>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <button className="text-brand text-sm font-medium" type="button">
            AI 상세 해설 보기
          </button>
          <button className="text-brand text-sm font-medium" type="button">
            유사 문제 추천
          </button>
        </div>
      </div>
    </>
  );
}

function WrongVersion() {
  return (
    <>
      <div className="text-center pt-12 pb-8">
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          ✗
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-sem-error-text)" }}>
          오답입니다
        </h1>
        <p className="text-secondary mt-2">괜찮아요, 해설을 확인해보세요</p>
      </div>

      <div className="card-base space-y-0">
        <div
          className="rounded-lg p-4 mb-4"
          style={{
            backgroundColor: "var(--color-sem-error-light)",
            borderLeft: "4px solid var(--color-sem-error)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">내가 선택한 답</span>
            <span
              className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
              style={{ backgroundColor: "#FEE2E2", color: "var(--color-sem-error-text)" }}
            >
              {MOCK_WRONG.selectedKey}
            </span>
          </div>
          <pre className="text-sm font-mono leading-relaxed">
            <code>{MOCK_WRONG.selectedSql}</code>
          </pre>
          <p className="text-secondary text-sm mt-2">{MOCK_WRONG.whyWrong}</p>
        </div>

        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: "var(--color-sem-success-light)",
            borderLeft: "4px solid var(--color-sem-success)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">정답</span>
            <span
              className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold"
              style={{ backgroundColor: "#DCFCE7", color: "var(--color-sem-success-text)" }}
            >
              {MOCK_WRONG.correctKey}
            </span>
          </div>
          <pre className="text-sm font-mono leading-relaxed">
            <code>{MOCK_WRONG.correctSql}</code>
          </pre>
          <p className="text-secondary text-sm mt-2">{MOCK_WRONG.whyCorrect}</p>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button className="btn-primary w-full" type="button">
            AI에게 자세히 물어보기
          </button>
          <button className="btn-secondary w-full" type="button">
            유사 문제로 복습
          </button>
        </div>
      </div>
    </>
  );
}

export default function AnswerFeedback() {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCorrect = searchParams.get("correct") !== "false";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 mx-auto max-w-[720px] w-full px-4 pb-24">
        {isCorrect ? <CorrectVersion /> : <WrongVersion />}
      </div>

      <div
        className="fixed bottom-0 inset-x-0 p-4 z-20"
        style={{
          backgroundColor: isCorrect
            ? "var(--color-sem-success-light)"
            : "var(--color-sem-error-light)",
        }}
      >
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            className="w-full h-[52px] rounded-lg text-white font-bold text-base"
            style={{
              backgroundColor: isCorrect
                ? "var(--color-sem-success)"
                : "var(--color-sem-error)",
            }}
            onClick={() => navigate("/questions")}
          >
            다음 문제
          </button>
        </div>
      </div>
    </div>
  );
}
