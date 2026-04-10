# Stats 페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 통계 페이지를 레이더 차트 + 카테고리 리스트 구조로 재구성한다.

**Architecture:** recharts 레이더 차트 컴포넌트와 카테고리 리스트 컴포넌트를 분리 생성하고, Stats.tsx에서 조합.

**Tech Stack:** React, TypeScript, Tailwind CSS, recharts

---

### Task 1: recharts 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: recharts 설치**

```bash
npm install recharts
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: recharts 의존성 추가 #41"
```

---

### Task 2: StatsRadarChart 컴포넌트 생성

**Files:**
- Create: `src/components/StatsRadarChart.tsx`

- [ ] **Step 1: StatsRadarChart 컴포넌트 작성**

```tsx
// src/components/StatsRadarChart.tsx
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { CategoryStats } from "../types/api";

interface StatsRadarChartProps {
  readonly categories: readonly CategoryStats[];
}

export default function StatsRadarChart({ categories }: StatsRadarChartProps) {
  const data = categories.map((cat) => ({
    subject: cat.displayName,
    value: Math.round(cat.correctRate * 100),
  }));

  return (
    <div className="card-base">
      <h2 className="text-lg font-bold mb-4">영역별 분석</h2>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 12, fill: "#6B7280" }}
            />
            <Radar
              dataKey="value"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/StatsRadarChart.tsx
git commit -m "feat: StatsRadarChart 레이더 차트 컴포넌트 생성 #41"
```

---

### Task 3: StatsCategoryList 컴포넌트 생성

**Files:**
- Create: `src/components/StatsCategoryList.tsx`

- [ ] **Step 1: StatsCategoryList 컴포넌트 작성**

색상 함수:
- correctRate >= 0.8: `#22C55E` (초록)
- correctRate >= 0.6: `#4F46E5` (인디고)
- correctRate >= 0.4: `#F59E0B` (주황)
- 미만: `#EF4444` (빨강)

```tsx
// src/components/StatsCategoryList.tsx
import { Play } from "lucide-react";
import type { CategoryStats } from "../types/api";

function getRateColor(rate: number): string {
  if (rate >= 0.8) return "#22C55E";
  if (rate >= 0.6) return "#4F46E5";
  if (rate >= 0.4) return "#F59E0B";
  return "#EF4444";
}

interface StatsCategoryListProps {
  readonly categories: readonly CategoryStats[];
  readonly onCategoryClick: (code: string) => void;
}

export default function StatsCategoryList({
  categories,
  onCategoryClick,
}: StatsCategoryListProps) {
  return (
    <div className="card-base">
      <h2 className="text-lg font-bold mb-4">카테고리별 실력</h2>
      <div className="space-y-3">
        {categories.map((cat) => {
          const pct = Math.round(cat.correctRate * 100);
          const color = getRateColor(cat.correctRate);
          return (
            <button
              key={cat.code}
              type="button"
              className="w-full flex items-center gap-3 group"
              onClick={() => onCategoryClick(cat.code)}
            >
              <span className="text-sm font-medium text-text-primary w-20 text-left shrink-0">
                {cat.displayName}
              </span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span
                className="text-sm font-bold w-12 text-right shrink-0"
                style={{ color }}
              >
                {pct}%
              </span>
              <span className="text-xs text-text-caption w-16 text-right shrink-0">
                {cat.solvedCount}문제
              </span>
              <Play
                size={14}
                className="text-text-caption opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/StatsCategoryList.tsx
git commit -m "feat: StatsCategoryList 카테고리 리스트 컴포넌트 생성 #41"
```

---

### Task 4: Stats.tsx에 새 컴포넌트 통합

**Files:**
- Modify: `src/pages/Stats.tsx`

- [ ] **Step 1: Stats.tsx 전체 교체**

```tsx
// src/pages/Stats.tsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProgress } from "../hooks/useProgress";
import { generatePractice } from "../api/practice";
import { usePracticeStore } from "../stores/practiceStore";
import { fetchCategoryStats } from "../api/progress";
import ErrorFallback from "../components/ErrorFallback";
import StatsRadarChart from "../components/StatsRadarChart";
import StatsCategoryList from "../components/StatsCategoryList";

export default function Stats() {
  const { data: progress, isLoading: progressLoading, isError, refetch } = useProgress();
  const { data: categories } = useQuery({
    queryKey: ["categoryStats"],
    queryFn: fetchCategoryStats,
    staleTime: 1000 * 60 * 5,
  });
  const navigate = useNavigate();
  const startSession = usePracticeStore((s) => s.startSession);

  const handleCategoryClick = async (code: string) => {
    const displayName = categories?.find((c) => c.code === code)?.displayName ?? code;
    const { sessionId, questions } = await generatePractice(code);
    startSession(sessionId, code, displayName, questions);
    navigate(`/practice/${sessionId}`);
  };

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-64 rounded-xl bg-border animate-pulse" />
        <div className="h-48 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-h1">내 실력, 한눈에</h1>
        <p className="text-secondary mt-1">약한 영역을 눌러 바로 연습해보세요</p>
      </div>

      <div className="card-base flex items-center divide-x divide-border">
        {[
          { value: String(progress?.solvedCount ?? 0), label: "푼 문제" },
          { value: `${Math.round((progress?.correctRate ?? 0) * 100)}%`, label: "정답률" },
          { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
        ].map((m) => (
          <div key={m.label} className="flex-1 text-center py-2">
            <p className="text-h1 text-text-primary">{m.value}</p>
            <p className="text-secondary mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {categories && categories.length > 0 ? (
        <>
          <StatsRadarChart categories={categories} />
          <StatsCategoryList
            categories={categories}
            onCategoryClick={handleCategoryClick}
          />
        </>
      ) : (
        <div className="card-base text-center py-12">
          <p className="text-text-caption">아직 풀이 기록이 없어요</p>
          <p className="text-xs text-text-caption mt-1">문제를 풀면 여기에 실력이 나타나요</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 테스트 실행**

Run: `npx vitest run`
Expected: 전체 통과

- [ ] **Step 4: 커밋**

```bash
git add src/pages/Stats.tsx
git commit -m "feat: Stats 페이지에 레이더 차트 + 카테고리 리스트 통합 #41"
```
