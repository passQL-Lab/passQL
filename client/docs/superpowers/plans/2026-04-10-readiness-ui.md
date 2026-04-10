# 합격 준비도 + Greeting UI 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 이슈 #52(합격 준비도), #53(인사 메시지 개선) 백엔드 스키마를 실제 UI에 반영한다.

**Architecture:** readiness toneKey 카피 매트릭스를 상수 파일로 분리하고, Home/Stats 페이지에서 readiness 데이터를 렌더링.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: readinessCopy.ts 카피 매트릭스 생성

**Files:**
- Create: `src/constants/readinessCopy.ts`

- [ ] **Step 1: 카피 매트릭스 작성**

```tsx
// src/constants/readinessCopy.ts
import type { ToneKey } from "../types/api";

type ScoreBand = "low" | "mid" | "high";

function getScoreBand(score: number): ScoreBand {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "mid";
  return "low";
}

const COPY_MATRIX: Record<ToneKey, Record<ScoreBand, string>> = {
  NO_EXAM: {
    low: "시험 일정을 설정하면 맞춤 전략을 세울 수 있어요",
    mid: "꾸준히 하고 있네요. 시험 일정을 설정해보세요",
    high: "실력이 탄탄해요. 시험 도전해볼 때예요",
  },
  ONBOARDING: {
    low: "첫 걸음을 뗐어요. 하루 5문제부터 시작해봐요",
    mid: "좋은 출발이에요. 이 페이스 유지해봐요",
    high: "빠르게 적응하고 있어요",
  },
  POST_EXAM: {
    low: "다음 시험을 준비하면서 약한 영역을 보강해봐요",
    mid: "복습하면서 감을 유지하세요",
    high: "다음 시험도 충분히 합격할 수 있어요",
  },
  TODAY: {
    low: "오늘이 시험이에요. 긴장 풀고 실력 발휘하세요",
    mid: "충분히 준비했어요. 자신감을 가지세요",
    high: "합격 준비 완료. 실력대로만 하면 돼요",
  },
  SPRINT: {
    low: "시험이 코앞이에요. 오늘 10문제만 풀어봐요",
    mid: "막판 스퍼트! 약한 영역 집중 공략하세요",
    high: "시험 준비 거의 끝. 마지막 점검만 남았어요",
  },
  PUSH: {
    low: "2주 안에 시험이에요. 매일 조금씩 풀어봐요",
    mid: "잘 하고 있어요. 남은 기간 꾸준히 하면 돼요",
    high: "이 페이스면 합격 충분해요",
  },
  STEADY: {
    low: "아직 시간 있어요. 하루 한 문제씩 습관을 만들어봐요",
    mid: "안정적으로 준비하고 있어요",
    high: "벌써 이 정도면 여유 있게 준비할 수 있어요",
  },
  EARLY: {
    low: "일찍 시작했어요. 기초부터 탄탄히 쌓아가봐요",
    mid: "여유롭게 준비하고 있네요. 좋은 흐름이에요",
    high: "미리 준비하는 만큼 합격이 가까워져요",
  },
};

export function getReadinessCopy(toneKey: ToneKey, score: number): string {
  const band = getScoreBand(score);
  return COPY_MATRIX[toneKey][band];
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 3: 커밋**

```bash
git add src/constants/readinessCopy.ts
git commit -m "feat: readiness toneKey 카피 매트릭스 추가 #41"
```

---

### Task 2: Home.tsx 합격 준비도 게이지 적용

**Files:**
- Modify: `src/pages/Home.tsx:113-124` (하단 2열 카드 섹션)

- [ ] **Step 1: import 추가**

```tsx
import { getReadinessCopy } from "../constants/readinessCopy";
```

- [ ] **Step 2: 하단 카드 섹션 교체**

현재 (line 113-124):
```tsx
<section className="grid grid-cols-2 gap-3">
  <div className="card-base ...">푼 문제</div>
  <div className="card-base ...">정답률 + bar</div>
</section>
```

변경:
```tsx
      {progress?.readiness ? (
        <section className="card-base mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-secondary text-sm">합격 준비도</h2>
            <span className="text-h1 text-brand">
              {Math.round(progress.readiness.score * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-border mb-3">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress.readiness.score * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary">
            {getReadinessCopy(progress.readiness.toneKey, progress.readiness.score)}
          </p>
          <div className="flex gap-4 mt-3 text-xs text-text-caption">
            <span>정확도 {Math.round(progress.readiness.accuracy * 100)}%</span>
            <span>커버리지 {Math.round(progress.readiness.coverage * 100)}%</span>
            <span>최근도 {Math.round(progress.readiness.recency * 100)}%</span>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-base flex flex-col items-start">
            <span className="text-h1 text-brand">{solved}</span>
            <span className="text-secondary mt-1">푼 문제</span>
          </div>
          <div className="card-base flex flex-col items-start">
            <span className="text-h1 text-brand">{Math.round(correctRate * 100)}%</span>
            <span className="text-secondary mt-1">정답률</span>
            <div className="w-full mt-2 h-1 rounded-full bg-border">
              <div className="h-full rounded-full bg-brand" style={{ width: `${correctRate * 100}%` }} />
            </div>
          </div>
        </section>
      )}
```

readiness가 null이면 기존 정답률 카드 폴백.

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 4: 커밋**

```bash
git add src/pages/Home.tsx
git commit -m "feat: Home 합격 준비도 게이지 + toneKey 카피 적용 #41"
```

---

### Task 3: Home.tsx messageType별 톤 분기

**Files:**
- Modify: `src/pages/Home.tsx:46-52` (인사 메시지 섹션)

- [ ] **Step 1: 인사 메시지에 messageType 스타일 적용**

현재:
```tsx
<section className="mb-6">
  <h1 className="text-h2">
    {greeting ? greeting.message.replace("{nickname}", greeting.nickname) : `안녕하세요, ${displayName}`}
  </h1>
</section>
```

변경:
```tsx
      <section className="mb-6">
        <h1 className="text-h2">
          {greeting
            ? greeting.message.replace("{nickname}", greeting.nickname)
            : `안녕하세요, ${displayName}`}
        </h1>
        {greeting?.messageType === "EXAM_DAY" && (
          <p className="text-sm font-medium mt-1" style={{ color: "var(--color-sem-error-text)" }}>
            오늘 시험이에요!
          </p>
        )}
        {greeting?.messageType === "URGENT" && (
          <p className="text-sm font-medium mt-1" style={{ color: "var(--color-sem-warning-text)" }}>
            시험이 얼마 남지 않았어요
          </p>
        )}
      </section>
```

GENERAL/COUNTDOWN은 별도 표시 없음. EXAM_DAY는 빨강, URGENT는 주황.

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Home.tsx
git commit -m "feat: Home 인사 메시지 messageType별 톤 분기 #41"
```

---

### Task 4: Stats.tsx 가짜 계산 제거 + readiness 활용

**Files:**
- Modify: `src/pages/Stats.tsx`

- [ ] **Step 1: 가짜 recentCorrect 제거 + readiness 활용**

현재 Stats.tsx 요약 카드:
```tsx
const recentCorrect = Math.round((progress?.solvedCount ?? 0) * (progress?.correctRate ?? 0));
// ...
{ value: `${progress?.solvedCount ?? 0}문제`, label: "푼 문제" },
{ value: `${recentCorrect}문제`, label: "최근 7일 정답" },
{ value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
```

변경:
```tsx
  const readiness = progress?.readiness;
  const readinessPercent = readiness ? Math.round(readiness.score * 100) : null;
```

요약 카드:
```tsx
{ value: `${progress?.solvedCount ?? 0}문제`, label: "푼 문제" },
{ value: readinessPercent != null ? `${readinessPercent}%` : `${Math.round((progress?.correctRate ?? 0) * 100)}%`, label: readinessPercent != null ? "합격 준비도" : "정답률" },
{ value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
```

가짜 `recentCorrect` 계산 삭제. readiness가 있으면 합격 준비도, 없으면 정답률 폴백.

- [ ] **Step 2: import 정리**

`recentCorrect` 관련 코드 삭제 후 사용하지 않는 import 확인.

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`

- [ ] **Step 4: 테스트 실행**

Run: `npx vitest run`

- [ ] **Step 5: 커밋**

```bash
git add src/pages/Stats.tsx
git commit -m "feat: Stats 가짜 계산 제거, readiness 합격 준비도 표시 #41"
```
