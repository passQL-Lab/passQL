# 홈 화면 API 전체 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면에 greeting, todayQuestion, recommendations, selectedExamSchedule 4개 API를 연동하여 api-guide 스펙과 일치시킨다.

**Architecture:** 4개 API에 대한 React Query 커스텀 훅을 `src/hooks/useHome.ts`에 생성하고, `Home.tsx`에서 병렬 호출하여 섹션별로 렌더링한다. 각 섹션은 독립적으로 로딩/에러 처리하며, API 실패 시 해당 섹션만 숨긴다 (api-guide: "미구현 API 호출부는 에러 시 해당 섹션을 graceful하게 숨김 처리").

**Tech Stack:** React 19, TypeScript, @tanstack/react-query, Tailwind CSS + daisyUI, lucide-react

---

## File Structure

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/hooks/useHome.ts` | 홈 전용 React Query 훅 4개 | Create |
| `src/pages/Home.tsx` | 홈 페이지 — 4개 섹션 추가 | Modify |

기존 파일 (변경 없음):
- `src/api/home.ts` — `fetchGreeting()` 이미 존재
- `src/api/questions.ts` — `fetchTodayQuestion()`, `fetchRecommendations()` 이미 존재
- `src/api/examSchedules.ts` — `fetchSelectedSchedule()` 이미 존재
- `src/types/api.ts` — 모든 Response 타입 이미 정의됨

---

### Task 1: React Query 훅 생성 (`src/hooks/useHome.ts`)

**Files:**
- Create: `src/hooks/useHome.ts`

- [ ] **Step 1: useHome.ts 파일 생성**

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchGreeting } from "../api/home";
import { fetchTodayQuestion, fetchRecommendations } from "../api/questions";
import { fetchSelectedSchedule } from "../api/examSchedules";
import { useMemberStore } from "../stores/memberStore";

export function useGreeting() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["greeting", uuid],
    queryFn: () => fetchGreeting(uuid),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useTodayQuestion() {
  const uuid = useMemberStore((s) => s.uuid);
  return useQuery({
    queryKey: ["todayQuestion", uuid],
    queryFn: () => fetchTodayQuestion(uuid),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetchRecommendations(3),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useSelectedSchedule() {
  return useQuery({
    queryKey: ["selectedSchedule"],
    queryFn: fetchSelectedSchedule,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

---

### Task 2: Home.tsx — greeting 연동

**Files:**
- Modify: `src/pages/Home.tsx`

현재 46행: `<h1 className="text-h2">안녕하세요, {displayName}</h1>`
→ greeting API 응답이 있으면 그 메시지를, 없으면 기존 "안녕하세요, {displayName}" 폴백.

- [ ] **Step 1: useGreeting import 추가 및 호출**

```typescript
// 기존 import에 추가
import { useGreeting, useTodayQuestion, useRecommendations, useSelectedSchedule } from "../hooks/useHome";
```

컴포넌트 내부 (line 10 부근, useMember() 아래):
```typescript
const { data: greeting } = useGreeting();
```

- [ ] **Step 2: greeting 메시지 렌더링 변경**

기존 (line 46):
```tsx
<h1 className="text-h2">안녕하세요, {displayName}</h1>
```

변경:
```tsx
<div>
  <h1 className="text-h2">안녕하세요, {displayName}</h1>
  {greeting?.message && (
    <p className="text-secondary mt-1">{greeting.message}</p>
  )}
</div>
```

---

### Task 3: Home.tsx — 오늘의 문제(Today Question) 섹션 추가

**Files:**
- Modify: `src/pages/Home.tsx`

api-guide: `fetchTodayQuestion(memberUuid?)` → `TodayQuestionResponse { question: QuestionSummary | null, alreadySolvedToday: boolean }`

Design.md 기준: card-base 스타일, brand 좌측 보더, ChevronRight 아이콘.

- [ ] **Step 1: useTodayQuestion 훅 호출 추가**

컴포넌트 내부:
```typescript
const { data: today } = useTodayQuestion();
```

- [ ] **Step 2: 기존 "문제 풀기" 섹션을 오늘의 문제로 교체**

기존 (lines 49-58):
```tsx
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
```

변경:
```tsx
<section className="mb-4">
  {today?.question ? (
    <Link to={`/questions/${today.question.questionUuid}`}>
      <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-secondary mb-1">
            {today.alreadySolvedToday ? "오늘의 문제 (완료)" : "오늘의 문제"}
          </p>
          <p className="text-body truncate">{today.question.stemPreview}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-topic">{today.question.topicName}</span>
            <StarRating level={today.question.difficulty} />
          </div>
        </div>
        <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
      </div>
    </Link>
  ) : (
    <Link to="/questions">
      <div className="card-base flex items-center gap-4 border-l-4 border-l-brand cursor-pointer hover:bg-surface transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-secondary mb-1">문제 풀기</p>
          <p className="text-body">SQL 문제를 풀어보세요</p>
        </div>
        <ChevronRight size={20} className="text-text-caption flex-shrink-0" />
      </div>
    </Link>
  )}
</section>
```

---

### Task 4: Home.tsx — 시험 일정(Exam Schedule) 섹션 추가

**Files:**
- Modify: `src/pages/Home.tsx`

api-guide: `fetchSelectedSchedule()` → `ExamScheduleResponse { examScheduleUuid, certType, round, examDate, isSelected } | null`
선택된 일정 없으면 null → 섹션 숨김.

- [ ] **Step 1: useSelectedSchedule 훅 호출 추가, Calendar 아이콘 import**

```typescript
import { Flame, ChevronRight, Calendar } from "lucide-react";
```

컴포넌트 내부:
```typescript
const { data: schedule } = useSelectedSchedule();
```

- [ ] **Step 2: 스트릭 뱃지 아래에 시험 일정 카드 추가**

스트릭 섹션(lines 61-73) 아래에 추가:
```tsx
{schedule && (
  <section className="mb-6">
    <div className="card-base flex items-center gap-3">
      <Calendar size={18} className="text-brand flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-secondary text-sm">{schedule.certType} {schedule.round}회</p>
        <p className="text-body font-bold">{schedule.examDate}</p>
      </div>
    </div>
  </section>
)}
```

---

### Task 5: Home.tsx — 추천 문제(Recommendations) 섹션 추가

**Files:**
- Modify: `src/pages/Home.tsx`

api-guide: `fetchRecommendations(size=3)` → `RecommendationsResponse { questions: QuestionSummary[] }`

- [ ] **Step 1: useRecommendations 훅 호출 추가**

컴포넌트 내부:
```typescript
const { data: recommendations } = useRecommendations();
```

- [ ] **Step 2: 통계 카드 섹션 아래에 추천 문제 목록 추가**

통계 grid 섹션(lines 75-87) 아래에 추가:
```tsx
{recommendations && recommendations.questions.length > 0 && (
  <section className="mt-6">
    <h2 className="text-secondary text-sm mb-3">추천 문제</h2>
    <div className="space-y-2">
      {recommendations.questions.map((q) => (
        <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`}>
          <div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-body truncate">{q.stemPreview}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge-topic">{q.topicName}</span>
                <StarRating level={q.difficulty} />
              </div>
            </div>
            <ChevronRight size={16} className="text-text-caption flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  </section>
)}
```

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
git add src/hooks/useHome.ts src/pages/Home.tsx
git commit -m "feat: 홈 화면 greeting/today/recommendations/exam-schedule API 연동 #41"
```
