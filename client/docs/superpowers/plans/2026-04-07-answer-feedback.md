# Answer Feedback Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prompt4_AnswerFeedback.md 스펙대로 정답/오답 결과 화면 UI를 mock 데이터 기반으로 구현한다. 풀스크린 전환, 듀오링고 스타일.

**Architecture:** AnswerFeedback.tsx 페이지를 새로 생성하고 `/questions/:id/result` 라우트에 연결한다. URL query param `?correct=true/false`로 정답/오답 버전을 토글한다(mock 확인용). AppLayout 밖에 별도 라우트로 배치하여 풀스크린 효과를 준다.

**Tech Stack:** React 19, Tailwind CSS 4 tokens, react-router-dom

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/pages/AnswerFeedback.tsx` | 정답/오답 결과 화면 (풀스크린) |
| Modify | `src/App.tsx` | `/questions/:id/result` 라우트 추가 (AppLayout 밖) |

---

### Task 1: AnswerFeedback 페이지 생성 + 라우트 연결

**Files:**
- Create: `src/pages/AnswerFeedback.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/pages/AnswerFeedback.tsx` 생성**

```tsx
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
      {/* Top section */}
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

      {/* Explanation card */}
      <div className="card-base">
        <p className="text-secondary text-sm mb-3">해설</p>

        {/* Correct choice pill + SQL */}
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

        {/* Rationale */}
        <p className="text-body leading-relaxed" style={{ color: "#374151" }}>
          {MOCK_CORRECT.rationale}
        </p>

        {/* Concept tags */}
        <div className="flex gap-2 mt-4">
          {MOCK_CORRECT.tags.map((tag) => (
            <span key={tag} className="badge-topic">{tag}</span>
          ))}
        </div>

        {/* Action links */}
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
      {/* Top section */}
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

      {/* Comparison card */}
      <div className="card-base space-y-0">
        {/* My answer */}
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

        {/* Correct answer */}
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

        {/* Action buttons */}
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCorrect = searchParams.get("correct") !== "false";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Content */}
      <div className="flex-1 mx-auto max-w-[720px] w-full px-4 pb-24">
        {isCorrect ? <CorrectVersion /> : <WrongVersion />}
      </div>

      {/* Sticky bottom bar */}
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
```

- [ ] **Step 2: `src/App.tsx` 수정 — 라우트 추가**

AppLayout 밖에 풀스크린 라우트로 추가한다.

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import AnswerFeedback from "./pages/AnswerFeedback";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <Questions /> },
      { path: "questions/:id", element: <QuestionDetail /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "questions/:id/result",
    element: <AnswerFeedback />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

**확인 방법:**
- `/questions/1/result` → 정답 버전 (기본)
- `/questions/1/result?correct=false` → 오답 버전

**스펙 체크리스트:**
- ✅ 풀스크린 전환 (AppLayout 밖, 탭바/사이드바 없음)
- ✅ **정답**: ✓ 아이콘 #DCFCE7 원, "정답입니다!" 24px bold #16A34A, 부제 #6B7280, 해설 카드 (A pill + green-tinted SQL + rationale + concept tags), action links, sticky "다음 문제" #22C55E 52px
- ✅ **오답**: ✗ 아이콘 #FEE2E2 원, "오답입니다" #DC2626, "괜찮아요" 부제, 내 답(#FEF2F2/빨강) vs 정답(#F0FDF4/초록) 비교, "AI에게 자세히 물어보기" primary 버튼 + "유사 문제로 복습" secondary, sticky "다음 문제" #EF4444 52px
- ✅ Desktop: 720px max-width centered, generous top margin
- ✅ "다음 문제" unmissable — largest target, always visible
- ✅ Korean text throughout

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/AnswerFeedback.tsx src/App.tsx
git commit -m "feat: 정답/오답 결과 화면 UI 구현 (풀스크린, mock 데이터) #9"
```
