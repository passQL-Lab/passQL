# Member API 실적용 — 웹 내 변경된 API 반영 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** memberStore에 구현된 `ensureRegistered()`를 앱 시작 시 호출하고, Home/Settings에서 실 닉네임을 표시하며, Settings에서 닉네임 재생성을 활성화한다.

**Architecture:** App.tsx에서 `ensureRegistered()`를 useEffect로 호출한다. `useMember` 훅을 생성하여 `fetchMe` 조회 + `regenerateNickname` mutation을 제공한다. Home과 Settings에서 nickname을 memberStore에서 읽되, fetchMe로 최신 닉네임을 동기화한다.

**Tech Stack:** React 19, TanStack Query, Zustand, react-router-dom

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/hooks/useMember.ts` | fetchMe 조회 + regenerateNickname mutation |
| Modify | `src/App.tsx` | 앱 시작 시 ensureRegistered() 호출 |
| Modify | `src/pages/Home.tsx` | UUID fallback → nickname 표시 |
| Modify | `src/pages/Settings.tsx` | fetchMe 닉네임 + regenerateNickname 활성화 |

---

### Task 1: useMember 훅 생성 + App.tsx에서 ensureRegistered 호출

**Files:**
- Create: `src/hooks/useMember.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/hooks/useMember.ts` 생성**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, regenerateNickname } from "../api/members";
import { useMemberStore } from "../stores/memberStore";

export function useMember() {
  const uuid = useMemberStore((s) => s.uuid);
  const setNickname = useMemberStore((s) => s.setNickname);

  const query = useQuery({
    queryKey: ["member", uuid],
    queryFn: fetchMe,
    enabled: !!uuid,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  // sync nickname to store when fetched
  if (query.data?.nickname && query.data.nickname !== useMemberStore.getState().nickname) {
    setNickname(query.data.nickname);
  }

  return query;
}

export function useRegenerateNickname() {
  const queryClient = useQueryClient();
  const setNickname = useMemberStore((s) => s.setNickname);

  return useMutation({
    mutationFn: regenerateNickname,
    onSuccess: (result) => {
      setNickname(result.nickname);
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}
```

- [ ] **Step 2: App.tsx에서 ensureRegistered() 호출**

App 컴포넌트 안에서 useEffect로 한 번만 호출.

```tsx
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import AnswerFeedback from "./pages/AnswerFeedback";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import { ensureRegistered } from "./stores/memberStore";

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
  useEffect(() => {
    ensureRegistered();
  }, []);

  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMember.ts src/App.tsx
git commit -m "feat: useMember 훅 + App 시작 시 ensureRegistered 호출 #13"
```

---

### Task 2: Home 닉네임 표시 + Settings 닉네임 재생성 활성화

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Home.tsx — nickname 표시**

현재 `uuid.slice(0, 8)`을 닉네임으로 표시. memberStore에서 nickname을 읽어 표시하되, 없으면 UUID fallback.

```tsx
import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useProgress } from "../hooks/useProgress";
import { useMemberStore } from "../stores/memberStore";

export default function Home() {
  const { data: progress, isLoading } = useProgress();
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const displayName = nickname || uuid.slice(0, 8);
  const initials = displayName.slice(0, 2);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-10 w-48 rounded bg-border animate-pulse" />
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-border animate-pulse" />
          <div className="h-24 rounded-xl bg-border animate-pulse" />
        </div>
      </div>
    );
  }

  const solved = progress?.solved ?? 0;
  const correctRate = progress?.correctRate ?? 0;
  const streak = progress?.streakDays ?? 0;

  return (
    <div className="py-6 space-y-0">
      <section className="flex items-center gap-3 mb-8">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {initials}
        </div>
        <h1 className="text-h2">안녕하세요, {displayName}</h1>
      </section>

      {streak > 0 && (
        <section className="mb-6">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
            style={{
              backgroundColor: "var(--color-sem-warning-light)",
              color: "var(--color-sem-warning-text)",
            }}
          >
            <Flame size={16} className="inline" /> 연속 {streak}일
          </span>
        </section>
      )}

      <section className="mb-4">
        <Link to="/questions">
          <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-secondary mb-1">문제 풀기</p>
              <p className="text-body">SQL 문제를 풀어보세요</p>
            </div>
            <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{solved}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>
        <div className="card-base flex flex-col items-start">
          <span className="text-h1 text-brand">{Math.round(correctRate)}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div className="h-full rounded-full bg-brand" style={{ width: `${correctRate}%` }} />
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Settings.tsx — fetchMe 닉네임 + regenerateNickname 활성화**

```tsx
import { Copy, RefreshCw } from "lucide-react";
import { useMemberStore } from "../stores/memberStore";
import { useRegenerateNickname } from "../hooks/useMember";

export default function Settings() {
  const uuid = useMemberStore((s) => s.uuid);
  const nickname = useMemberStore((s) => s.nickname);
  const truncatedUuid = uuid.slice(0, 20) + "...";
  const regenerateMutation = useRegenerateNickname();

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  return (
    <div className="py-6">
      <div className="card-base p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">디바이스 ID</p>
            <p className="font-mono text-[13px] text-text-primary mt-1">{truncatedUuid}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            title="복사"
            onClick={handleCopy}
          >
            <Copy size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-secondary text-sm">닉네임</p>
            <p className="text-body font-bold mt-1">{nickname || uuid.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              regenerateMutation.isPending
                ? "text-text-caption animate-spin"
                : "text-text-caption hover:text-brand"
            }`}
            title="닉네임 재생성"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-secondary text-sm">버전</p>
          <p className="text-caption text-sm mt-1">1.0.0-MVP</p>
        </div>
      </div>

      <div className="text-center mt-8 space-y-1">
        <p className="text-[13px]" style={{ color: "#D1D5DB" }}>passQL</p>
        <p className="text-xs" style={{ color: "#D1D5DB" }}>Powered by Vite + React</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx src/pages/Settings.tsx
git commit -m "feat: Home 닉네임 표시 + Settings 닉네임 재생성 활성화 #13"
```
