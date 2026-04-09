# 홈 화면 구텐베르크 레이아웃 + 학습 히트맵 캘린더 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면을 구텐베르크 Z 패턴으로 재배치하고, greeting/닉네임 구조를 개선하고, 학습 히트맵 캘린더 컴포넌트를 추가한다.

**Architecture:** Home.tsx의 섹션 순서를 Z 패턴에 맞게 재배치. HeatmapCalendar를 별도 컴포넌트로 생성. 히트맵 API(`GET /progress/heatmap`)가 백엔드 미구현이므로 mock 데이터 기반으로 구현하되, API 함수/훅/타입을 실제 스펙대로 미리 만들어서 백엔드 완성 시 mock만 제거하면 동작하게 한다.

**Tech Stack:** React 19, TypeScript, @tanstack/react-query, Tailwind CSS, lucide-react

---

## 최종 레이아웃 (구텐베르크 Z 패턴)

```
┌─────────────────────────────────┐
│ greeting 메시지                  │  Primary Optical Area
│ 용감한 판다                      │  (첫 시선)
├────────────────┬────────────────┤
│ 오늘의 문제     │ 시험 D-day     │  Z 중간 (핵심 액션)
├────────────────┴────────────────┤
│ 히트맵 캘린더 (30일)             │  Z 중간 (학습 현황)
│ ■■□■■■□■■■□□■■■...             │
│ 스트릭 뱃지                      │
├────────────────┬────────────────┤
│ 푼 문제 42      │ 정답률 68%     │  통계
├────────────────┴────────────────┤
│ 추천 문제                        │  Terminal Area (다음 행동)
└─────────────────────────────────┘
```

## File Structure

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/types/api.ts` | `HeatmapEntry`, `HeatmapResponse` 타입 추가 | Modify |
| `src/api/progress.ts` | `fetchHeatmap()` API 함수 추가 | Modify |
| `src/api/mock-data.ts` | 히트맵 mock 데이터 추가 | Modify |
| `src/hooks/useHome.ts` | `useHeatmap()` 훅 추가 | Modify |
| `src/components/HeatmapCalendar.tsx` | 히트맵 캘린더 컴포넌트 | Create |
| `src/pages/Home.tsx` | 구텐베르크 레이아웃 재배치 + 히트맵 통합 | Modify |

---

### Task 1: 히트맵 타입 및 API 함수 추가

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/api/progress.ts`

- [ ] **Step 1: HeatmapEntry, HeatmapResponse 타입 추가 (`src/types/api.ts`)**

`ProgressResponse` 아래에 추가:

```typescript
// === Heatmap ===
export interface HeatmapEntry {
  readonly date: string;
  readonly solvedCount: number;
  readonly correctCount: number;
}

export interface HeatmapResponse {
  readonly entries: readonly HeatmapEntry[];
}
```

- [ ] **Step 2: fetchHeatmap 함수 추가 (`src/api/progress.ts`)**

기존 `fetchProgress` 아래에 추가:

```typescript
import type { ProgressResponse, HeatmapResponse } from "../types/api";

export function fetchHeatmap(memberUuid: string, from?: string, to?: string): Promise<HeatmapResponse> {
  const query = new URLSearchParams();
  query.set("memberUuid", memberUuid);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiFetch(`/progress/heatmap?${query}`);
}
```

---

### Task 2: 히트맵 mock 데이터 추가

**Files:**
- Modify: `src/api/mock-data.ts`

- [ ] **Step 1: mock 히트맵 데이터 생성 및 라우트 추가**

import에 `HeatmapResponse` 추가.

mock 데이터 상수 추가 (MOCK_PROGRESS 근처):

```typescript
function generateMockHeatmap(): HeatmapResponse {
  const entries = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // 70% 확률로 풀이 기록 있음
    if (Math.random() < 0.7) {
      const solved = Math.floor(Math.random() * 6) + 1;
      const correct = Math.floor(Math.random() * (solved + 1));
      entries.push({ date: dateStr, solvedCount: solved, correctCount: correct });
    }
  }
  return { entries };
}
```

`getMockResponse` 함수 내부에 라우트 추가 (GET /progress 분기 위에):

```typescript
// GET /progress/heatmap
if (method === "GET" && path.startsWith("/progress/heatmap")) {
  return generateMockHeatmap() satisfies HeatmapResponse;
}
```

---

### Task 3: useHeatmap 훅 추가

**Files:**
- Modify: `src/hooks/useHome.ts`

- [ ] **Step 1: useHeatmap 훅 추가**

import에 `fetchHeatmap` 추가, 훅 추가:

```typescript
import { fetchHeatmap } from "../api/progress";

export function useHeatmap() {
  const uuid = useMemberStore((s) => s.uuid);
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["heatmap", uuid, from, today],
    queryFn: () => fetchHeatmap(uuid, from, today),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
```

---

### Task 4: HeatmapCalendar 컴포넌트 생성

**Files:**
- Create: `src/components/HeatmapCalendar.tsx`

- [ ] **Step 1: HeatmapCalendar 컴포넌트 작성**

Design.md 히트맵 색상 스케일 5단계:
- Level 0 `#F5F5F5`: 0문제
- Level 1 `#EEF2FF`: 1문제
- Level 2 `#C7D2FE`: 2-3문제
- Level 3 `#818CF8`: 4-5문제
- Level 4 `#4F46E5`: 6문제+

```typescript
import type { HeatmapEntry } from "../types/api";

const HEATMAP_COLORS = [
  "#F5F5F5", // 0
  "#EEF2FF", // 1
  "#C7D2FE", // 2-3
  "#818CF8", // 4-5
  "#4F46E5", // 6+
] as const;

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function buildDayMap(entries: readonly HeatmapEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.date, e.solvedCount);
  }
  return map;
}

function getLast30Days(): readonly string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

interface HeatmapCalendarProps {
  readonly entries: readonly HeatmapEntry[];
}

export function HeatmapCalendar({ entries }: HeatmapCalendarProps) {
  const dayMap = buildDayMap(entries);
  const days = getLast30Days();

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {days.map((date) => {
          const count = dayMap.get(date) ?? 0;
          const level = getLevel(count);
          const dayLabel = new Date(date).getDate();
          return (
            <div
              key={date}
              className="w-7 h-7 rounded flex items-center justify-center text-[10px]"
              style={{
                backgroundColor: HEATMAP_COLORS[level],
                color: level >= 3 ? "#FFFFFF" : "#9CA3AF",
              }}
              title={`${date}: ${count}문제`}
            >
              {dayLabel}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-text-caption">0</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-text-caption">6+</span>
      </div>
    </div>
  );
}
```

---

### Task 5: Home.tsx 구텐베르크 레이아웃 재배치

**Files:**
- Modify: `src/pages/Home.tsx`

현재 섹션 순서: greeting → 오늘의문제 → 스트릭 → 시험일정 → 통계(2열) → 추천문제

새 순서 (구텐베르크 Z):
1. greeting 메시지 + 닉네임 (Primary)
2. 오늘의 문제 + 시험 D-day (2열, Z 중간)
3. 히트맵 캘린더 + 스트릭 (Z 중간)
4. 통계 2열 (푼 문제 / 정답률)
5. 추천 문제 (Terminal)

- [ ] **Step 1: import 추가**

```typescript
import { HeatmapCalendar } from "../components/HeatmapCalendar";
import { useGreeting, useTodayQuestion, useRecommendations, useSelectedSchedule, useHeatmap } from "../hooks/useHome";
```

- [ ] **Step 2: useHeatmap 훅 호출 추가**

```typescript
const { data: heatmap } = useHeatmap();
```

- [ ] **Step 3: greeting 섹션에 닉네임 추가**

```tsx
<section className="mb-6">
  <h1 className="text-h2">
    {greeting?.message ?? `안녕하세요, ${displayName}`}
  </h1>
  <p className="text-secondary mt-1">{displayName}</p>
</section>
```

- [ ] **Step 4: 오늘의 문제 + 시험 D-day를 2열 그리드로 변경**

기존 오늘의 문제 section(full width) + 시험 일정 section(full width)을 하나의 2열 그리드로 합침:

```tsx
<section className="grid grid-cols-2 gap-3 mb-4">
  {/* 오늘의 문제 */}
  {today?.question ? (
    <Link to={`/questions/${today.question.questionUuid}`} className="block">
      <div className="card-base h-full flex flex-col gap-2 cursor-pointer hover:bg-surface transition-colors">
        <p className="text-secondary text-sm">
          {today.alreadySolvedToday ? "오늘의 문제 (완료)" : "오늘의 문제"}
        </p>
        <p className="text-body text-sm truncate">{today.question.stemPreview}</p>
        <div className="flex items-center gap-2 mt-auto">
          <span className="badge-topic">{today.question.topicName}</span>
          <StarRating level={today.question.difficulty} />
        </div>
      </div>
    </Link>
  ) : (
    <Link to="/questions" className="block">
      <div className="card-base h-full flex flex-col justify-center cursor-pointer hover:bg-surface transition-colors">
        <p className="text-secondary text-sm">문제 풀기</p>
        <p className="text-body text-sm">SQL 문제를 풀어보세요</p>
      </div>
    </Link>
  )}

  {/* 시험 D-day */}
  {schedule ? (
    <div className="card-base h-full flex flex-col justify-center">
      <p className="text-secondary text-sm">{schedule.certType} {schedule.round}회</p>
      <p className="text-h2 text-brand mt-1">
        D-{Math.max(0, Math.ceil((new Date(schedule.examDate).getTime() - Date.now()) / 86400000))}
      </p>
      <p className="text-caption mt-1">{schedule.examDate}</p>
    </div>
  ) : (
    <div className="card-base h-full flex flex-col justify-center">
      <p className="text-secondary text-sm">시험 일정</p>
      <p className="text-caption">선택된 일정 없음</p>
    </div>
  )}
</section>
```

- [ ] **Step 5: 히트맵 캘린더 + 스트릭 섹션 추가**

오늘의문제/시험D-day 그리드 아래, 통계 카드 위에 추가:

```tsx
<section className="card-base mb-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-secondary text-sm">학습 현황</h2>
    {streak > 0 && (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
        style={{
          backgroundColor: "var(--color-sem-warning-light)",
          color: "var(--color-sem-warning-text)",
        }}
      >
        <Flame size={14} className="inline mr-1" />
        연속 {streak}일
      </span>
    )}
  </div>
  {heatmap ? (
    <HeatmapCalendar entries={heatmap.entries} />
  ) : (
    <div className="h-16 bg-border animate-pulse rounded" />
  )}
</section>
```

- [ ] **Step 6: 기존 스트릭 단독 섹션 제거**

기존 스트릭 뱃지 section(lines 80-92)을 삭제 — Step 5에서 히트맵 카드 내부로 이동했으므로.

- [ ] **Step 7: 기존 시험 일정 단독 섹션 제거**

기존 시험 일정 section(lines 94-104)을 삭제 — Step 4에서 2열 그리드로 이동했으므로.

---

### Task 6: 빌드 검증 및 커밋

- [ ] **Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 성공

- [ ] **Step 2: 테스트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 통과

- [ ] **Step 3: 커밋**

```bash
git add src/types/api.ts src/api/progress.ts src/api/mock-data.ts src/hooks/useHome.ts src/components/HeatmapCalendar.tsx src/pages/Home.tsx
git commit -m "feat: 홈 화면 구텐베르크 레이아웃 + 학습 히트맵 캘린더 #41"
```
