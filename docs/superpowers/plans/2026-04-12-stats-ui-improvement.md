# Stats UI 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 통계 페이지(Stats)의 요약 카드 아이콘 추가, AI 분석 카드 레이아웃 개선 + 단어 fade-in 애니메이션, 바 차트를 daisyUI progress 기반 토픽 리스트로 교체, 합격 준비도 및 토픽 현황 ? 팝오버 추가

**Architecture:** Stats.tsx는 레이아웃 조율만 담당하고, 각 섹션은 독립 컴포넌트로 분리한다. 새 애니메이션 CSS는 components.css에 추가한다. 팝오버는 인라인 컴포넌트로 구현한다(단일 사용이므로 별도 파일 불필요).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react

---

### Task 1: AI 애니메이션 CSS 추가

**Files:**
- Modify: `client/src/styles/components.css`

- [ ] **Step 1: components.css 하단에 애니메이션 추가**

파일 끝에 아래 블록을 추가한다.

```css
/* ── AI 분석 카드 단어 fade-in ── */
/* 단어별 blur→clear 전환 — .ai-word 클래스를 JS로 동적 생성 후 .visible 토글 */
@keyframes ai-word-in {
  from {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

.ai-word {
  display: inline;
  opacity: 0;
  filter: blur(4px);
}

.ai-word-visible {
  animation: ai-word-in 0.25s ease-out both;
}

/* ── AI 카드 헤더 슬라이드 ── */
@keyframes ai-header-slide {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.animate-ai-header {
  animation: ai-header-slide 0.3s ease-out both;
}

/* ── Sparkles 팝 ── */
@keyframes sparkle-pop {
  0%   { transform: scale(0.7) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
  100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
}

.animate-sparkle-pop {
  animation: sparkle-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── 팝오버 진입 ── */
@keyframes popover-in {
  from { opacity: 0; transform: translateY(4px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-popover-in {
  animation: popover-in 0.18s ease-out both;
}
```

- [ ] **Step 2: 개발 서버 확인 후 커밋**

```bash
cd client && npm run dev
# 빌드 에러 없으면 Ctrl+C
git add client/src/styles/components.css
git commit -m "feat: AI 분석 카드 및 팝오버 애니메이션 CSS 추가 #049"
```

---

### Task 2: StatsAnalysisCard 개선 (Sparkles 아이콘 + 단어 fade-in)

**Files:**
- Modify: `client/src/components/StatsAnalysisCard.tsx`

- [ ] **Step 1: StatsAnalysisCard.tsx 전체 교체**

```tsx
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

interface StatsAnalysisCardProps {
  readonly comment: string | null;
  readonly isLoading?: boolean;
}

// 텍스트를 단어 단위로 분리해 span.ai-word로 감싼 뒤 순서대로 visible 클래스 토글
function animateWords(container: HTMLElement, text: string, startDelay = 200) {
  container.innerHTML = "";
  const tokens = text.split(/(\s+)/);
  tokens.forEach((token) => {
    if (/^\s+$/.test(token)) {
      container.appendChild(document.createTextNode(token));
      return;
    }
    const span = document.createElement("span");
    span.className = "ai-word";
    span.textContent = token;
    container.appendChild(span);
  });

  const words = container.querySelectorAll<HTMLElement>(".ai-word");
  words.forEach((w, i) => {
    setTimeout(() => {
      w.classList.add("ai-word-visible");
    }, startDelay + i * 55);
  });
}

export default function StatsAnalysisCard({ comment, isLoading }: StatsAnalysisCardProps) {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // comment가 로드될 때마다 애니메이션 재실행
    if (!comment || !textRef.current) return;
    animateWords(textRef.current, comment, 200);
  }, [comment]);

  if (isLoading) {
    return (
      <div className="card-base flex gap-3">
        <div className="w-7 h-7 rounded-lg bg-border animate-pulse shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-border rounded animate-pulse w-1/4" />
          <div className="h-3 bg-border rounded animate-pulse w-full" />
          <div className="h-3 bg-border rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!comment) return null;

  return (
    <div className="card-base">
      {/* 아이콘 + 제목 한 줄 */}
      <div className="animate-ai-header flex items-center gap-2 mb-2">
        <div className="animate-sparkle-pop w-7 h-7 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-brand" />
        </div>
        <h3 className="text-sm font-bold text-text-primary">AI 영역 분석</h3>
      </div>
      {/* 단어 단위 fade-in 텍스트 — ref로 DOM 직접 조작 */}
      <p
        ref={textRef}
        className="text-sm text-text-secondary leading-relaxed"
      />
    </div>
  );
}
```

- [ ] **Step 2: 브라우저에서 통계 탭 진입 → AI 분석 텍스트가 단어별로 나타나는지 확인**

- [ ] **Step 3: 커밋**

```bash
git add client/src/components/StatsAnalysisCard.tsx
git commit -m "feat: AI 분석 카드 Sparkles 아이콘 및 단어 fade-in 애니메이션 #049"
```

---

### Task 3: Stats.tsx 상단 요약 카드 아이콘 추가 + 합격 준비도 ? 팝오버

**Files:**
- Modify: `client/src/pages/Stats.tsx`

- [ ] **Step 1: Stats.tsx 전체 교체**

```tsx
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, BarChart2, Zap, HelpCircle } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { fetchTopicAnalysis, fetchAiComment } from "../api/progress";
import ErrorFallback from "../components/ErrorFallback";
import StatsAnalysisCard from "../components/StatsAnalysisCard";
import StatsRadarChart from "../components/StatsRadarChart";
import StatsTopicList from "../components/StatsTopicList";
import { useStagger } from "../hooks/useStagger";

// 합격 준비도 ? 팝오버 — Stats 내부에서만 사용하는 단순 팝오버
function ReadinessPopover({
  accuracy,
  coverage,
  recency,
  open,
}: {
  accuracy: number;
  coverage: number;
  recency: number;
  open: boolean;
}) {
  if (!open) return null;
  return (
    <div className="animate-popover-in absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-toast text-white rounded-xl p-3 z-50 shadow-lg">
      {/* 위쪽 화살표 */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-toast [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
      <p className="text-xs font-bold mb-2">합격 준비도란?</p>
      <p className="text-xs text-gray-300 leading-relaxed mb-3">
        정답률 · 학습 범위 · 최근 학습 빈도를 종합한 점수예요. 꾸준히 다양한 토픽을 풀수록 올라가요.
      </p>
      <div className="flex flex-col gap-1.5">
        {[
          { label: "정답률", value: accuracy },
          { label: "범위", value: coverage },
          { label: "꾸준함", value: recency },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 w-12 shrink-0">{label}</span>
            <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-medium rounded-full"
                style={{ width: `${Math.round(value * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-brand-medium w-7 text-right shrink-0">
              {Math.round(value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Stats() {
  const [readinessPopoverOpen, setReadinessPopoverOpen] = useState(false);
  const readinessBtnRef = useRef<HTMLButtonElement>(null);

  const {
    data: progress,
    isLoading: progressLoading,
    isError,
    refetch,
  } = useProgress();

  const { data: topicAnalysis } = useQuery({
    queryKey: ["topicAnalysis"],
    queryFn: fetchTopicAnalysis,
    staleTime: 1000 * 60 * 5,
  });

  // AI 코멘트 (Redis 24h 캐싱 — 제출 시 서버에서 자동 무효화)
  const { data: aiComment, isLoading: aiCommentLoading } = useQuery({
    queryKey: ["aiComment"],
    queryFn: fetchAiComment,
    staleTime: 1000 * 60 * 60,
  });

  const readiness = progress?.readiness;
  const readinessPercent = readiness ? Math.round(readiness.score * 100) : null;
  const topicStats = topicAnalysis?.topicStats ?? [];

  // 팝오버 바깥 클릭 시 닫기
  useEffect(() => {
    if (!readinessPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (readinessBtnRef.current?.contains(e.target as Node)) return;
      setReadinessPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [readinessPopoverOpen]);

  const stagger = useStagger();
  const s0 = stagger(0);
  const s1 = stagger(1);
  const s2 = stagger(2);
  const s3 = stagger(3);
  const s4 = stagger(4);

  if (progressLoading) {
    return (
      <div className="py-6 space-y-6">
        <div className="h-24 rounded-xl bg-border animate-pulse" />
        <div className="h-20 rounded-xl bg-border animate-pulse" />
        <div className="h-64 rounded-xl bg-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return <ErrorFallback onRetry={() => refetch()} />;
  }

  // 요약 카드 지표 정의
  const summaryMetrics = [
    {
      icon: <CheckSquare size={18} className="text-brand" />,
      iconBg: "bg-accent-light",
      value: `${progress?.solvedCount ?? 0}문제`,
      label: "푼 문제",
      extra: null,
    },
    {
      icon: <BarChart2 size={18} className="text-brand" />,
      iconBg: "bg-accent-light",
      value:
        readinessPercent != null
          ? `${readinessPercent}%`
          : `${Math.round((progress?.correctRate ?? 0) * 100)}%`,
      label: readinessPercent != null ? "합격 준비도" : "정답률",
      // 합격 준비도일 때만 ? 팝오버 버튼 표시
      extra: readinessPercent != null ? "readiness" : null,
    },
    {
      icon: <Zap size={18} className="text-warning" />,
      iconBg: "bg-warning-light",
      value: `${progress?.streakDays ?? 0}일`,
      label: "연속 학습",
      extra: null,
    },
  ] as const;

  return (
    <div className="py-6 space-y-6">
      {/* ① 제목 */}
      <section className={s0.className}>
        <h1 className="text-h1">내 실력, 한눈에</h1>
        <p className="text-secondary mt-1">약한 영역을 눌러 바로 연습해보세요</p>
      </section>

      {/* ② 상단 요약 카드 */}
      <section className={`card-base p-0 overflow-visible ${s1.className}`}>
        <div className="flex divide-x divide-border">
          {summaryMetrics.map((m, idx) => (
            <div key={m.label} className="flex-1 text-center py-5 px-2 relative">
              {/* 아이콘 */}
              <div className={`w-9 h-9 rounded-[10px] ${m.iconBg} flex items-center justify-center mx-auto mb-2`}>
                {m.icon}
              </div>
              <p className="text-h1 text-2xl">{m.value}</p>
              {/* 라벨 + ? 버튼 (합격 준비도만) */}
              <div className="flex items-center justify-center gap-1 mt-0.5 relative">
                <p className="text-secondary text-[13px]">{m.label}</p>
                {m.extra === "readiness" && (
                  <>
                    <button
                      ref={readinessBtnRef}
                      onClick={() => setReadinessPopoverOpen((v) => !v)}
                      className="w-4 h-4 rounded-full bg-surface-code flex items-center justify-center shrink-0"
                      aria-label="합격 준비도 설명"
                    >
                      <HelpCircle size={10} className="text-text-caption" />
                    </button>
                    <ReadinessPopover
                      accuracy={readiness?.accuracy ?? 0}
                      coverage={readiness?.coverage ?? 0}
                      recency={readiness?.recency ?? 0}
                      open={readinessPopoverOpen}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {topicStats.length > 0 ? (
        <>
          {/* ③ AI 코멘트 */}
          <section className={s2.className}>
            <StatsAnalysisCard
              comment={aiComment?.comment ?? null}
              isLoading={aiCommentLoading}
            />
          </section>
          {/* ④ 레이더 차트 */}
          <section className={s3.className}>
            <StatsRadarChart topicStats={topicStats} />
          </section>
          {/* ⑤ 토픽 리스트 */}
          <section className={s4.className}>
            <StatsTopicList topicStats={topicStats} />
          </section>
        </>
      ) : (
        <section className={`card-base text-center py-12 ${s2.className}`}>
          <p className="text-text-caption">아직 풀이 기록이 없어요</p>
          <p className="text-xs text-text-caption mt-1">
            문제를 풀면 여기에 실력이 나타나요
          </p>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add client/src/pages/Stats.tsx
git commit -m "feat: 통계 요약 카드 아이콘 추가 및 합격 준비도 팝오버 구현 #049"
```

---

### Task 4: StatsTopicList 컴포넌트 신규 작성 (recharts 제거, daisyUI progress 교체)

**Files:**
- Create: `client/src/components/StatsTopicList.tsx`

- [ ] **Step 1: StatsTopicList.tsx 생성**

```tsx
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import type { TopicStat } from "../types/api";

interface StatsTopicListProps {
  readonly topicStats: readonly TopicStat[];
}

// 정답률에 따라 색상 클래스 결정
function getRateColor(rate: number): { badge: string; bar: string } {
  if (rate >= 0.8) return { badge: "text-sem-success-text bg-sem-success-light", bar: "bg-sem-success" };
  if (rate >= 0.6) return { badge: "text-brand bg-accent-light",                 bar: "bg-brand" };
  if (rate >= 0.4) return { badge: "text-warning-text bg-warning-light",          bar: "bg-warning" };
  return           { badge: "text-sem-error-text bg-sem-error-light",             bar: "bg-sem-error" };
}

// ? 팝오버 — 토픽 리스트 보는 법 설명
function TopicListPopover({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="animate-popover-in absolute top-full left-0 mt-2 w-60 bg-toast text-white rounded-xl p-3 z-50 shadow-lg">
      <div className="absolute -top-1.5 left-6 w-3 h-1.5 bg-toast [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
      <p className="text-xs font-bold mb-2">어떻게 보나요?</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-sm bg-brand mt-0.5 shrink-0" />
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">막대 길이</span> — 해당 토픽을 얼마나 많이 풀었는지 나타내요
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-sm bg-sem-error mt-0.5 shrink-0" />
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">색상 뱃지</span> — 정답률을 나타내요. 빨간색일수록 취약한 영역이에요
          </p>
        </div>
      </div>
    </div>
  );
}

// 범례 색상 항목
const LEGEND = [
  { color: "bg-sem-success", label: "80%↑" },
  { color: "bg-brand",       label: "60%↑" },
  { color: "bg-warning",     label: "40%↑" },
  { color: "bg-sem-error",   label: "취약" },
] as const;

export default function StatsTopicList({ topicStats }: StatsTopicListProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 막대 길이의 기준값 — 전체 토픽 중 가장 많이 푼 문제 수
  const maxSolved = Math.max(...topicStats.map((s) => s.solvedCount), 1);

  return (
    <div className="card-base">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5 mb-4 relative">
        <h2 className="text-base font-bold text-text-primary">토픽별 학습 현황</h2>
        <button
          onClick={() => setPopoverOpen((v) => !v)}
          onBlur={() => setPopoverOpen(false)}
          className="w-4 h-4 rounded-full bg-surface-code flex items-center justify-center shrink-0"
          aria-label="토픽별 학습 현황 설명"
        >
          <HelpCircle size={10} className="text-text-caption" />
        </button>
        <TopicListPopover open={popoverOpen} />
      </div>

      {/* 토픽 목록 */}
      <div className="flex flex-col gap-3.5">
        {topicStats.map((stat) => {
          const unsolved = stat.solvedCount === 0;
          const colors = unsolved ? null : getRateColor(stat.correctRate);
          const barWidth = unsolved ? 0 : Math.round((stat.solvedCount / maxSolved) * 100);

          return (
            <div key={stat.topicUuid}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-[13px] font-medium ${unsolved ? "text-text-caption" : "text-text-primary"}`}>
                  {stat.displayName}
                </span>
                {unsolved ? (
                  <span className="text-[12px] text-border">미학습</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-text-caption">{stat.solvedCount}문제</span>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${colors!.badge}`}>
                      {Math.round(stat.correctRate * 100)}%
                    </span>
                  </div>
                )}
              </div>
              {/* progress 바 — daisyUI progress 대신 div로 구현 (색상 클래스 동적 적용 위해) */}
              <div className="w-full h-2 bg-surface-code rounded-full overflow-hidden">
                {!unsolved && (
                  <div
                    className={`h-full rounded-full ${colors!.bar}`}
                    style={{ width: `${barWidth}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[11px] text-text-caption">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Stats.tsx에서 StatsBarChart import 제거 확인**

Stats.tsx에서 `StatsBarChart` import가 없는지 확인한다. Task 3에서 이미 `StatsTopicList`로 교체했다.

- [ ] **Step 3: 브라우저에서 통계 탭 확인**
  - 토픽 리스트가 렌더링되는지
  - 막대 길이가 JOIN(12문제)이 가장 길게 표시되는지
  - 미학습 토픽이 회색으로 표시되는지
  - ? 버튼 클릭 시 팝오버 표시/닫힘 동작하는지

- [ ] **Step 4: 커밋**

```bash
git add client/src/components/StatsTopicList.tsx
git commit -m "feat: StatsTopicList 컴포넌트 구현 (recharts 제거, daisyUI progress 교체) #049"
```

---

### Task 5: Tailwind 토큰 클래스 확인 및 누락 처리

**Files:**
- Read: `client/src/styles/tokens.css`
- Modify: `client/src/styles/tokens.css` (필요 시)

- [ ] **Step 1: tokens.css에서 사용된 CSS 변수 확인**

아래 클래스들이 tokens.css에 정의된 CSS 변수를 참조하는지 확인한다:
- `bg-accent-light` → `--color-brand-light`
- `bg-warning-light` → `--color-sem-warning-light`
- `text-warning` → `--color-sem-warning`
- `text-warning-text` → `--color-sem-warning-text`
- `bg-toast` → `--color-toast-bg`
- `bg-brand-medium` → `--color-brand-medium`
- `bg-surface-code` → `--color-surface-code`
- `bg-sem-success` → `--color-sem-success`
- `bg-sem-error` → `--color-sem-error`
- `bg-warning` → `--color-sem-warning`

```bash
grep -n "sem-warning\|toast-bg\|brand-medium" client/src/styles/tokens.css
```

- [ ] **Step 2: 미정의 변수가 있다면 tokens.css에 추가**

tokens.css를 읽은 후 누락된 변수만 추가한다. 이미 있으면 이 Step 생략.

- [ ] **Step 3: 빌드 에러 없는지 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: `✓ built in` 메시지

- [ ] **Step 4: 커밋 (변경 있을 경우만)**

```bash
git add client/src/styles/tokens.css
git commit -m "feat: 통계 UI 개선 - 누락 CSS 토큰 추가 #049"
```

---

### Task 6: StatsBarChart.tsx 삭제 확인

**Files:**
- Delete (사용자 확인 후): `client/src/components/StatsBarChart.tsx`

- [ ] **Step 1: StatsBarChart.tsx가 다른 곳에서 import되는지 확인**

```bash
grep -r "StatsBarChart" client/src/
```

Expected: 아무 결과도 없어야 함 (Stats.tsx에서 이미 제거됨)

- [ ] **Step 2: 사용자에게 파일 삭제 여부 확인 요청**

StatsBarChart.tsx가 어디에서도 사용되지 않음을 확인했으면, 사용자에게 삭제 승인을 받는다. 승인 시에만 삭제한다.

---

### Task 7: 최종 검증

- [ ] **Step 1: 개발 서버에서 전체 통계 화면 점검**

```bash
cd client && npm run dev
```

체크리스트:
- [ ] 상단 요약 카드 3개 모두 아이콘 표시됨
- [ ] 합격 준비도 ? 버튼 클릭 → 팝오버 열림 / 바깥 클릭 → 닫힘
- [ ] AI 분석 카드: Sparkles 아이콘 + 제목 한 줄, 텍스트 단어 fade-in 동작
- [ ] 영역별 분석 레이더 차트 기존과 동일
- [ ] 토픽별 학습 현황 리스트 표시, JOIN 막대 가장 김, 미학습 회색
- [ ] ? 버튼 클릭 → 토픽 팝오버 열림 / blur → 닫힘
- [ ] TypeScript 빌드 에러 없음

- [ ] **Step 2: 최종 빌드 확인**

```bash
cd client && npm run build 2>&1 | tail -5
```

Expected: `✓ built in`
