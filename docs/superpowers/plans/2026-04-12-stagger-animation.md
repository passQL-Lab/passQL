# Stagger Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 및 네비게이션 탭(AI문제·통계·설정) 진입 시 각 페이지의 주요 섹션이 위에서부터 50ms 간격으로 순차 페이드인(fade-up)되도록 구현한다.

**Architecture:** `useStagger` 훅이 CSS variable(`--stagger-delay`)을 inline style로 주입하고, `components.css`의 `.animate-stagger` 클래스가 해당 변수를 animation-delay로 소비한다. `AppLayout`은 `location.pathname`을 `<Outlet>` key로 사용해 탭 전환 시 페이지를 리마운트하여 스태거를 재실행한다. 기존 `animate-greeting` / `animate-greeting-delayed` 클래스는 이 작업에서 완전히 제거한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, CSS custom properties

---

## 파일 구조

| 작업 | 파일 |
|------|------|
| 신규 생성 | `client/src/hooks/useStagger.ts` |
| 수정 | `client/src/styles/components.css` — staggerIn keyframe 추가, greetingIn 제거 |
| 수정 | `client/src/components/AppLayout.tsx` — Outlet에 key 추가 |
| 수정 | `client/src/pages/Home.tsx` — useStagger 적용, animate-greeting 제거 |
| 수정 | `client/src/pages/CategoryCards.tsx` — useStagger 적용 |
| 수정 | `client/src/pages/Stats.tsx` — useStagger 적용 |
| 수정 | `client/src/pages/Settings.tsx` — useStagger 적용 |

---

## Task 1: 인프라 셋업 — useStagger 훅 + CSS keyframe + AppLayout 리마운트

**Files:**
- Create: `client/src/hooks/useStagger.ts`
- Modify: `client/src/styles/components.css`
- Modify: `client/src/components/AppLayout.tsx`

- [ ] **Step 1: `useStagger.ts` 작성**

```ts
// client/src/hooks/useStagger.ts

/**
 * 섹션별 순차 페이드인(stagger) 애니메이션 클래스+딜레이를 반환한다.
 * 반환된 함수에 섹션 인덱스를 넘기면 CSS variable이 담긴 style 객체와
 * animate-stagger 클래스명을 함께 돌려준다.
 *
 * 사용 예:
 *   const stagger = useStagger();
 *   <section {...stagger(0)}>그리팅</section>
 *   <section {...stagger(1)}>카드</section>
 */
export function useStagger() {
  return function (index: number): {
    className: string;
    style: React.CSSProperties;
  } {
    return {
      className: "animate-stagger",
      // CSS 클래스가 --stagger-delay 변수를 animation-delay로 소비한다.
      // CLAUDE.md의 "인라인 style 속성 절대 금지" 규칙의 예외:
      // CSS variable 주입은 Tailwind로 표현 불가능하므로 허용 (step-slider 선례 동일)
      style: { "--stagger-delay": `${index * 50}ms` } as React.CSSProperties,
    };
  };
}
```

- [ ] **Step 2: `components.css` — greetingIn 블록을 staggerIn으로 교체**

`client/src/styles/components.css`의 `/* ── Greeting fade-in + slide-up animation ── */` 블록 전체(366~385줄)를 아래로 교체한다.

```css
/* ── Stagger fade-up animation ── */
/* 네비게이션 탭 진입 시 섹션별 순차 페이드인. --stagger-delay는 useStagger 훅이 주입. */
@keyframes staggerIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-stagger {
  animation: staggerIn 0.3s ease-out var(--stagger-delay, 0ms) both;
}
```

- [ ] **Step 3: `AppLayout.tsx` — useLocation import 추가 + Outlet에 key 적용**

```tsx
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BarChart3, Settings, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logo from "../assets/logo/logo.png";
import MobileHeader from "./MobileHeader";
import TeamModal from "./TeamModal";
```

`AppLayout` 함수 내부를 아래로 교체한다.

```tsx
export default function AppLayout() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  // 탭 전환 시 Outlet을 리마운트해 스태거 애니메이션을 재실행한다.
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface">
      <SidebarNav />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <MobileHeader onTeamClick={() => setTeamModalOpen(true)} />
        <main className="flex-1 lg:py-8 pb-16 lg:pb-8">
          <div className="mx-auto max-w-180 px-4 lg:px-0">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
      <BottomTabNav />

      {teamModalOpen && (
        <TeamModal onClose={() => setTeamModalOpen(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 개발 서버 실행 및 TypeScript 오류 없음 확인**

```bash
cd client && npm run dev
```

브라우저 콘솔에 빨간 오류 없으면 OK. 탭 전환 시 네트워크 탭에서 API 재호출 발생 확인.

- [ ] **Step 5: 커밋**

```bash
git add client/src/hooks/useStagger.ts client/src/styles/components.css client/src/components/AppLayout.tsx
git commit -m "feat: useStagger 훅, staggerIn CSS keyframe, AppLayout 탭 리마운트 추가 #046"
```

---

## Task 2: Home 페이지 — useStagger 적용 + animate-greeting 제거

**Files:**
- Modify: `client/src/pages/Home.tsx`

섹션 순서: ①그리팅 줄1 ②그리팅 줄2+서브메시지 ③오늘의문제+일정 카드행 ④학습현황 ⑤합격준비도/통계 ⑥AI추천문제

- [ ] **Step 1: `useStagger` import 추가 + stagger 선언**

`Home.tsx` 상단 import 블록 마지막에 추가.

```tsx
import { useStagger } from "../hooks/useStagger";
```

`export default function Home()` 함수 내부 최상단에 추가.

```tsx
const stagger = useStagger();
```

- [ ] **Step 2: JSX — 기존 animate-greeting 제거 및 stagger 적용**

`return` 블록의 `<div className="py-6 space-y-0">` 내부를 아래로 교체한다.

```tsx
return (
  <div className="py-6 space-y-0">
    {/* ① 그리팅 줄1 */}
    <section {...stagger(0)} className="mb-1">
      <h1 className="text-h2 leading-snug">
        {greeting ? (
          parseGreetingLines(greeting.message, greeting.nickname).map((line, i) =>
            i === 0 ? <span key={i} className="block">{line}</span> : null
          )
        ) : (
          <span>안녕하세요, {displayName}</span>
        )}
      </h1>
    </section>

    {/* ② 그리팅 줄2 + 서브메시지 */}
    <section {...stagger(1)} className="mb-6">
      <h1 className="text-h2 leading-snug">
        {greeting &&
          parseGreetingLines(greeting.message, greeting.nickname).map((line, i) =>
            i > 0 ? <span key={i} className="block">{line}</span> : null
          )}
      </h1>
      {greeting?.messageType === "EXAM_DAY" && (
        <p className="text-sm font-medium mt-1 text-sem-error-text">
          오늘 시험이에요!
        </p>
      )}
      {greeting?.messageType === "URGENT" && (
        <p className="text-sm font-medium mt-1 text-sem-warning-text">
          시험이 얼마 남지 않았어요
        </p>
      )}
    </section>

    {/* ③ 오늘의 문제 + 시험 일정 */}
    <section {...stagger(2)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {today?.question ? (
        today.alreadySolvedToday ? (
          <div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-sem-success-light border-l-4 border-sem-success">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-sem-success-text">오늘의 문제</p>
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-sem-success">
                <Check size={14} className="text-white" />
              </div>
            </div>
            <p className="text-body text-sm truncate">{today.question.stemPreview}</p>
            <div className="flex items-center gap-2 mt-auto">
              <span className="badge-topic">{today.question.topicName}</span>
              <StarRating level={today.question.difficulty} />
            </div>
          </div>
        ) : (
          <Link to="/daily-challenge" className="block">
            <div className="card-base shadow-sm h-full flex flex-col gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
              <p className="text-secondary text-sm">오늘의 문제</p>
              <p className="text-body text-sm truncate">{today.question.stemPreview}</p>
              <div className="flex items-center gap-2 mt-auto">
                <span className="badge-topic">{today.question.topicName}</span>
                <StarRating level={today.question.difficulty} />
              </div>
            </div>
          </Link>
        )
      ) : (
        <Link to="/questions" className="block">
          <div className="card-base shadow-sm h-full flex flex-col justify-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
            <p className="text-secondary text-sm">AI문제 풀기</p>
            <p className="text-body text-sm">SQL AI문제를 풀어보세요</p>
          </div>
        </Link>
      )}

      {schedule ? (
        <div className="card-base shadow-sm h-full flex flex-col justify-center">
          <p className="text-secondary text-sm">{schedule.certType} {schedule.round}회</p>
          <p className="text-h2 text-brand mt-1">{schedule.examDate}</p>
        </div>
      ) : (
        <div className="card-base shadow-sm h-full flex flex-col justify-center">
          <p className="text-secondary text-sm">시험 일정</p>
          <p className="text-caption">선택된 일정 없음</p>
        </div>
      )}
    </section>

    {/* ④ 학습 현황 */}
    <section {...stagger(3)} className="card-base shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-secondary text-sm">학습 현황</h2>
        {streak > 0 && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold bg-sem-warning-light text-sem-warning-text">
            <Flame size={14} className="inline mr-1" fill="currentColor" />
            연속 {streak}일
          </span>
        )}
      </div>
      {heatmapLoading ? (
        <div className="h-16 bg-border animate-pulse rounded" />
      ) : heatmapError ? (
        <div className="h-16 flex items-center justify-between px-1">
          <p className="text-caption text-sm">히트맵을 불러올 수 없습니다</p>
          <button
            type="button"
            className="btn-compact inline-flex items-center gap-1 text-xs"
            onClick={() => refetchHeatmap()}
          >
            <RefreshCw size={12} />
            재시도
          </button>
        </div>
      ) : heatmap ? (
        <HeatmapCalendar entries={heatmap.entries} />
      ) : (
        <div className="h-16 bg-border animate-pulse rounded" />
      )}
    </section>

    {/* ⑤ 합격 준비도 / 통계 */}
    {progressLoading ? (
      <section {...stagger(4)} className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-24 rounded-xl bg-border animate-pulse" />
      </section>
    ) : progressError ? (
      <section {...stagger(4)} className="card-base mb-4 flex items-center justify-between">
        <p className="text-secondary text-sm">학습 데이터를 불러올 수 없습니다</p>
        <button
          type="button"
          className="btn-compact inline-flex items-center gap-1 text-xs"
          onClick={() => refetchProgress()}
        >
          <RefreshCw size={12} />
          재시도
        </button>
      </section>
    ) : progress?.readiness ? (
      <section {...stagger(4)} className="card-base shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-secondary text-sm">합격 준비도</h2>
          <span className="text-h1 text-brand">{Math.round(progress.readiness.score * 100)}%</span>
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
      <section {...stagger(4)} className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-base shadow-sm flex flex-col items-start">
          <span className="text-h1 text-brand">{solved}</span>
          <span className="text-secondary mt-1">푼 문제</span>
        </div>
        <div className="card-base shadow-sm flex flex-col items-start">
          <span className="text-h1 text-brand">{Math.round(correctRate * 100)}%</span>
          <span className="text-secondary mt-1">정답률</span>
          <div className="w-full mt-2 h-1 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${correctRate * 100}%` }}
            />
          </div>
        </div>
      </section>
    )}

    {/* ⑥ AI 추천문제 */}
    {!recommendationsError && recommendations && recommendations.questions.length > 0 && (
      <section {...stagger(5)} className="mt-6">
        <h2 className="text-secondary text-sm mb-3 flex items-center gap-1">
          <Sparkles size={14} fill="currentColor" />
          AI 추천문제
        </h2>
        <div className="space-y-3">
          {recommendations.questions.map((q) => (
            <Link key={q.questionUuid} to={`/questions/${q.questionUuid}`} className="block">
              <div className="card-base shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <p className="text-body truncate">{q.stemPreview}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-topic">{q.topicName}</span>
                    <StarRating level={q.difficulty} />
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-caption shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    )}
  </div>
);
```

- [ ] **Step 3: 홈화면 스태거 동작 확인**

개발 서버에서 홈 탭 클릭 → 그리팅 줄1부터 AI추천문제까지 50ms 간격으로 순차 페이드인되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: 홈화면 섹션별 스태거 페이드인 적용 #046"
```

---

## Task 3: 나머지 페이지(CategoryCards·Stats·Settings) + CSS 잔재 정리

**Files:**
- Modify: `client/src/pages/CategoryCards.tsx`
- Modify: `client/src/pages/Stats.tsx`
- Modify: `client/src/pages/Settings.tsx`

### CategoryCards

섹션 순서: ①제목+서브텍스트 ②카드 그리드

- [ ] **Step 1: `CategoryCards.tsx` — useStagger 적용**

import 추가:
```tsx
import { useStagger } from "../hooks/useStagger";
```

`export default function CategoryCards()` 함수 내부 최상단에 추가:
```tsx
const stagger = useStagger();
```

`return` 블록 전체 교체:

```tsx
return (
  <div className="py-6">
    {/* ① 제목 + 서브텍스트 */}
    <section {...stagger(0)}>
      <h1 className="text-h1 mb-1 flex items-center gap-2">
        <Sparkles size={24} fill="currentColor" />
        AI문제 풀기
      </h1>
      <p className="text-secondary mb-6">
        골라보세요, AI가 딱 맞는 문제를 만들어드릴게요
      </p>
    </section>

    {/* ② 카드 그리드 */}
    {isLoading ? (
      <section {...stagger(1)} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="card-base h-28 animate-pulse bg-border" />
        ))}
      </section>
    ) : (
      <section {...stagger(1)} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {topics?.map((t) => {
          const Icon = getTopicIcon(t.code);
          return (
            <button
              key={t.code}
              type="button"
              className="card-base flex flex-col items-center text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-brand"
              onClick={() => handleSelect(t.code, t.displayName)}
            >
              <div className="w-11 h-11 bg-accent-light rounded-[10px] flex items-center justify-center mb-3">
                <Icon size={22} className="text-brand" />
              </div>
              <span className="text-body font-bold">{t.displayName}</span>
            </button>
          );
        })}
      </section>
    )}

    {error && (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
        <AlertCircle size={16} className="text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )}

    {generating && <LoadingOverlay topicName={generating} />}
  </div>
);
```

### Stats

섹션 순서: ①제목+서브텍스트 ②상단 요약 카드 ③AI코멘트 ④레이더차트 ⑤바차트

- [ ] **Step 2: `Stats.tsx` — useStagger 적용**

import 추가:
```tsx
import { useStagger } from "../hooks/useStagger";
```

`export default function Stats()` 함수 내부 최상단에 추가:
```tsx
const stagger = useStagger();
```

정상 렌더 경로의 `return` 블록 교체 (로딩/에러 분기는 기존 유지):

```tsx
return (
  <div className="py-6 space-y-6">
    {/* ① 제목 + 서브텍스트 */}
    <section {...stagger(0)}>
      <h1 className="text-h1">내 실력, 한눈에</h1>
      <p className="text-secondary mt-1">약한 영역을 눌러 바로 연습해보세요</p>
    </section>

    {/* ② 상단 요약 카드 */}
    <section {...stagger(1)} className="card-base flex items-center divide-x divide-border">
      {[
        { value: `${progress?.solvedCount ?? 0}문제`, label: "푼 문제" },
        {
          value:
            readinessPercent != null
              ? `${readinessPercent}%`
              : `${Math.round((progress?.correctRate ?? 0) * 100)}%`,
          label: readinessPercent != null ? "합격 준비도" : "정답률",
        },
        { value: `${progress?.streakDays ?? 0}일`, label: "연속 학습" },
      ].map((m) => (
        <div key={m.label} className="flex-1 text-center py-2">
          <p className="text-h1 text-text-primary">{m.value}</p>
          <p className="text-secondary mt-1">{m.label}</p>
        </div>
      ))}
    </section>

    {topicStats.length > 0 ? (
      <>
        {/* ③ AI 코멘트 */}
        <section {...stagger(2)}>
          <StatsAnalysisCard comment={aiComment?.comment ?? null} isLoading={aiCommentLoading} />
        </section>
        {/* ④ 레이더 차트 */}
        <section {...stagger(3)}>
          <StatsRadarChart topicStats={topicStats} />
        </section>
        {/* ⑤ 바 차트 */}
        <section {...stagger(4)}>
          <StatsBarChart topicStats={topicStats} />
        </section>
      </>
    ) : (
      <section {...stagger(2)} className="card-base text-center py-12">
        <p className="text-text-caption">아직 풀이 기록이 없어요</p>
        <p className="text-xs text-text-caption mt-1">문제를 풀면 여기에 실력이 나타나요</p>
      </section>
    )}
  </div>
);
```

### Settings

섹션 순서: ①제목 ②설정 카드 ③하단 로고+카피라이트

- [ ] **Step 3: `Settings.tsx` — useStagger 적용**

import 추가:
```tsx
import { useStagger } from "../hooks/useStagger";
```

`export default function Settings()` 함수 내부 최상단에 추가:
```tsx
const stagger = useStagger();
```

`return` 블록 전체 교체:

```tsx
return (
  <div className="py-6">
    {/* ① 제목 */}
    <section {...stagger(0)}>
      <h1 className="text-h1 mb-6">설정</h1>
    </section>

    {/* ② 설정 카드 */}
    <section {...stagger(1)} className="card-base p-0">
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
          {copied ? <Check size={16} className="text-sem-success" /> : <Copy size={16} />}
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
        <p className="text-caption text-sm mt-1">{__APP_VERSION__}</p>
      </div>
    </section>

    {/* ③ 하단 로고 + 카피라이트 */}
    <section {...stagger(2)} className="text-center mt-8 space-y-2">
      <img src={logo} alt="passQL" className="h-5 w-auto mx-auto" />
      <p className="text-xs text-text-caption">© 2026 passQL. All rights reserved.</p>
    </section>
  </div>
);
```

### CSS 잔재 확인

- [ ] **Step 4: greetingIn 잔재 없음 확인**

```bash
grep -n "greeting" client/src/styles/components.css
```

Expected: `.greeting-nickname` 한 줄만 출력됨.

```bash
grep -rn "animate-greeting" client/src/
```

Expected: 아무것도 출력되지 않음.

- [ ] **Step 5: 전체 빌드 확인**

```bash
cd client && npm run build
```

Expected: `✓ built in` 메시지, TypeScript/빌드 오류 없음.

- [ ] **Step 6: 4개 탭 전체 동작 확인**

개발 서버에서 홈 → AI문제 → 통계 → 설정 순서로 탭 클릭. 각 탭 진입 시 섹션이 위에서부터 50ms 간격으로 순차 페이드인되는지 확인.

- [ ] **Step 7: 커밋**

```bash
git add client/src/pages/CategoryCards.tsx client/src/pages/Stats.tsx client/src/pages/Settings.tsx
git commit -m "feat: AI문제·통계·설정 페이지 섹션별 스태거 페이드인 적용 #046"
```
