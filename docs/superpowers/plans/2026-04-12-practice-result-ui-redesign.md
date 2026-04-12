# Practice Result UI 전면 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PracticeResult 결과 화면의 StepNavigator와 3개 스텝(점수/AI리뷰/문제별결과)을 전면 개선하여 일관된 UI와 AI 브랜딩, 순차 애니메이션, 문제 preview 아코디언을 구현한다.

**Architecture:** StepNavigator를 전면 재작성하여 상단 헤더를 제거하고 인디케이터를 상단으로 이동. PracticeResult의 3개 스텝을 각각 개선 — 스텝1은 staggered 애니메이션, 스텝2는 AI 브랜딩 카드, 스텝3은 아코디언 preview.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, lucide-react

---

## 파일 변경 목록

| 파일 | 변경 종류 | 내용 |
|------|-----------|------|
| `client/src/components/StepNavigator.tsx` | 전면 재작성 | 헤더 제거, 인디케이터 상단 이동, 버튼 텍스트 정리 |
| `client/src/pages/PracticeResult.tsx` | 수정 | 3개 스텝 모두 개선 |

---

## Task 1: StepNavigator 전면 재작성

**Files:**
- Modify: `client/src/components/StepNavigator.tsx`

- [ ] **Step 1: 기존 파일 내용 파악 후 전면 재작성**

`client/src/components/StepNavigator.tsx`를 아래 코드로 완전히 교체한다:

```tsx
import { useState, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface StepNavigatorProps {
  readonly steps: readonly ReactNode[];
  readonly lastButtonLabel?: string;
  readonly onLastStep?: () => void;
}

export default function StepNavigator({ steps, lastButtonLabel = "카테고리 목록으로", onLastStep }: StepNavigatorProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const navigate = useNavigate();
  const total = steps.length;
  const isLast = current === total - 1;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < total) setCurrent(idx);
  };

  const handleNext = () => {
    if (current < total - 1) goTo(current + 1);
    else onLastStep?.();
  };

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        // 50px 이상 스와이프 시 앞/뒤 이동
        if (diff > 50) handleNext();
        else if (diff < -50) goTo(current - 1);
      }}
    >
      {/* 상단 인디케이터 — 헤더 대신 단계 수만 표시 */}
      <div className="flex justify-center gap-1.5 pt-4 pb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {steps.map((step, i) => (
            <div key={i} className="min-w-full h-full flex flex-col items-center justify-center px-6 text-center">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 — 아이콘 없이 텍스트만 */}
      <div className="px-6 pb-6">
        <button
          type="button"
          className="w-full h-12 bg-brand text-white font-bold rounded-xl"
          onClick={handleNext}
        >
          {isLast ? lastButtonLabel : "다음"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 개발 서버 실행 후 결과 화면 진입 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/client
npm run dev
```

브라우저에서 연습 세션 완료 후 `/practice/:sessionId/result` 진입.
- 상단에 인디케이터 점(•••)만 보여야 함 (홈 버튼, 1/3 텍스트 없어야 함)
- 하단 버튼 "다음" 텍스트만 (ChevronRight 아이콘 없어야 함)
- 마지막 스텝에서 "카테고리 목록으로" 텍스트 확인

- [ ] **Step 3: 커밋**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL
git add client/src/components/StepNavigator.tsx
git commit -m "refactor: StepNavigator 헤더 제거, 인디케이터 상단 이동, 버튼 텍스트 정리 #155"
```

---

## Task 2: PracticeResult 스텝1 — 순차 애니메이션 + 아이콘

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

**핵심 원리:** Tailwind의 `opacity-0 translate-y-3` → `opacity-100 translate-y-0` 전환으로 fade-in + 위로 슬라이드 효과. `transition-all duration-300 ease-out` 적용. 인라인 style 금지 — `statsVisible` 배열로 각 항목 표시 여부를 관리.

- [ ] **Step 1: PracticeResult.tsx 상단 import에 아이콘 추가**

기존:
```tsx
import { Check, RotateCcw } from "lucide-react";
```

변경:
```tsx
import { Check, RotateCcw, Target, Clock, Timer, Sparkles } from "lucide-react";
```

- [ ] **Step 2: statsVisible 상태를 배열로 교체**

기존:
```tsx
const [statsVisible, setStatsVisible] = useState(false);
```

변경:
```tsx
// 각 통계 항목의 등장 여부를 인덱스별로 관리 (0: 정답률, 1: 총시간, 2: 문제당 평균)
const [visibleStats, setVisibleStats] = useState<boolean[]>([false, false, false]);
```

- [ ] **Step 3: ScoreCountUp onComplete 콜백에 순차 타이머 추가**

기존 `step1` JSX에서 `ScoreCountUp`의 `onComplete`:
```tsx
onComplete={() => setStatsVisible(true)}
```

변경 — `step1` 정의 위에 핸들러 추가:
```tsx
// 카운트업 완료 후 150ms 간격으로 순차 등장
const handleScoreComplete = () => {
  [0, 1, 2].forEach((i) => {
    setTimeout(() => {
      setVisibleStats((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }, i * 150);
  });
};
```

그리고 `ScoreCountUp`의 prop:
```tsx
onComplete={handleScoreComplete}
```

- [ ] **Step 4: 통계 항목 JSX 교체**

기존 통계 div 전체:
```tsx
<div
  className="flex gap-8 mt-8 transition-all duration-400"
  style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(12px)" }}
>
  <div className="text-center">
    <div className="text-lg font-bold">{analysis.totalCount > 0 ? Math.round((analysis.correctCount / analysis.totalCount) * 100) : 0}%</div>
    <div className="text-xs text-text-caption mt-0.5">정답률</div>
  </div>
  <div className="text-center">
    <div className="text-lg font-bold">{totalDuration}</div>
    <div className="text-xs text-text-caption mt-0.5">총 시간</div>
  </div>
  <div className="text-center">
    <div className="text-lg font-bold">{avgDuration}</div>
    <div className="text-xs text-text-caption mt-0.5">평균</div>
  </div>
</div>
```

변경:
```tsx
<div className="flex gap-8 mt-8">
  {/* 정답률 */}
  <div className={`text-center transition-all duration-300 ease-out ${visibleStats[0] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
    <div className="text-lg font-bold">{analysis.totalCount > 0 ? Math.round((analysis.correctCount / analysis.totalCount) * 100) : 0}%</div>
    <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
      <Target size={11} className="text-text-caption" />
      정답률
    </div>
  </div>
  {/* 총 시간 */}
  <div className={`text-center transition-all duration-300 ease-out ${visibleStats[1] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
    <div className="text-lg font-bold">{totalDuration}</div>
    <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
      <Clock size={11} className="text-text-caption" />
      총 시간
    </div>
  </div>
  {/* 문제당 평균 */}
  <div className={`text-center transition-all duration-300 ease-out ${visibleStats[2] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
    <div className="text-lg font-bold">{avgDuration}</div>
    <div className="flex items-center gap-1 text-xs text-text-caption mt-0.5 justify-center">
      <Timer size={11} className="text-text-caption" />
      문제당 평균
    </div>
  </div>
</div>
```

- [ ] **Step 5: 기존 `statsVisible` 참조 제거**

`step1` JSX에서 `statsVisible`을 참조하는 `<p>` 태그:
```tsx
<p
  className="text-body text-text-secondary mt-2 transition-opacity duration-300"
  style={{ opacity: statsVisible ? 1 : 0 }}
>
  정답
</p>
```

변경 (인라인 style 제거, 항상 표시):
```tsx
<p className="text-body text-text-secondary mt-2">
  정답
</p>
```

- [ ] **Step 6: 브라우저에서 스텝1 애니메이션 확인**

연습 세션 완료 후 스텝1 진입.
- ScoreCountUp 카운트업 완료 후 정답률 → 총 시간 → 문제당 평균 순으로 아래에서 위로 fade-in 등장 확인
- 각 레이블 앞에 회색 아이콘 (Target, Clock, Timer) 표시 확인
- "문제당 평균" 텍스트 확인

- [ ] **Step 7: 커밋**

```bash
git add client/src/pages/PracticeResult.tsx
git commit -m "feat: 결과화면 스텝1 통계 순차 애니메이션 및 아이콘 추가 #155"
```

---

## Task 3: PracticeResult 스텝2 — AI 리뷰 브랜딩

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

- [ ] **Step 1: step2 JSX 교체**

기존 `step2`:
```tsx
const step2 = (
  <div className="text-left w-full max-w-90 px-2 sm:px-0">
    <p className="text-2xl font-bold text-center mb-5">{analysis.greeting}</p>
    {/* AI 코멘트: null=로딩, ""=에러, 문자열=내용 */}
    {aiComment === null ? (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-border rounded w-full" />
        <div className="h-4 bg-border rounded w-5/6" />
        <div className="h-4 bg-border rounded w-4/6" />
      </div>
    ) : aiComment ? (
      <p className="text-body leading-relaxed">{aiComment}</p>
    ) : null}
  </div>
);
```

변경:
```tsx
const step2 = (
  <div className="text-left w-full max-w-90 px-2 sm:px-0">
    {/* AI 브랜딩 뱃지 */}
    <div className="flex justify-center mb-4">
      <span className="inline-flex items-center gap-1.5 bg-accent-light text-brand text-xs font-semibold px-3 py-1 rounded-full">
        <Sparkles size={13} />
        AI 분석
      </span>
    </div>
    <p className="text-2xl font-bold text-center mb-5">{analysis.greeting}</p>
    {/* AI 코멘트: null=로딩, ""=에러, 문자열=내용 — 인디고 border 카드로 감싸기 */}
    <div className="border-l-4 border-brand rounded-xl px-4 py-3 bg-accent-light/30">
      {aiComment === null ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-border rounded w-full" />
          <div className="h-4 bg-border rounded w-5/6" />
          <div className="h-4 bg-border rounded w-4/6" />
        </div>
      ) : aiComment ? (
        <p className="text-body leading-relaxed">{aiComment}</p>
      ) : null}
    </div>
  </div>
);
```

- [ ] **Step 2: 브라우저에서 스텝2 확인**

스텝2 진입 후:
- "AI 분석" 인디고 pill 뱃지가 상단에 표시되는지 확인
- AI 코멘트가 인디고 왼쪽 border 카드 안에 표시되는지 확인
- 로딩 중 스켈레톤이 카드 내부에 표시되는지 확인

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/PracticeResult.tsx
git commit -m "feat: 결과화면 스텝2 AI 리뷰 브랜딩 카드 추가 #155"
```

---

## Task 4: PracticeResult 스텝3 — 문제별 결과 아코디언

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

**핵심 원리:** CSS `grid-rows` 전환(`grid-rows-[0fr]` → `grid-rows-[1fr]`)으로 높이 애니메이션 구현. 내부 div에 `overflow-hidden` 필수. `transition-all duration-300 ease-out` 적용.

- [ ] **Step 1: openIndex 상태 추가**

`PracticeResult` 컴포넌트 내 기존 state 선언 아래에 추가:
```tsx
// 펼쳐진 문제 카드 인덱스 (null = 모두 닫힘)
const [openIndex, setOpenIndex] = useState<number | null>(null);
```

- [ ] **Step 2: step3 JSX 교체**

기존 `step3` 전체:
```tsx
const step3 = (
  <div className="w-full text-left overflow-y-auto">
    <p className="text-sm font-medium text-text-caption mb-3">문제별 결과</p>
    <div className="flex flex-col gap-2">
      {store.results.map((r, i) => {
        const q = store.questions[i];
        return (
          <div
            key={r.questionUuid}
            className={`flex items-center gap-3 p-3 bg-surface-card border rounded-[10px] ${
              r.isCorrect ? "border-border" : "border-red-300"
            }`}
          >
            <span className={`text-sm font-bold w-5 text-center ${r.isCorrect ? "text-green-600" : "text-red-600"}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{q?.stemPreview}</p>
              <p className="text-xs text-text-caption mt-0.5">{formatDuration(r.durationMs)}</p>
            </div>
            {r.isCorrect ? (
              <Check size={16} className="text-green-500 shrink-0" />
            ) : (
              <Link
                to={`/questions/${r.questionUuid}`}
                className="flex items-center gap-1 text-xs font-medium text-brand bg-accent-light rounded-md px-2.5 py-1.5"
              >
                <RotateCcw size={13} /> 다시
              </Link>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
```

변경:
```tsx
const step3 = (
  <div className="w-full text-left overflow-y-auto">
    <p className="text-sm font-medium text-text-caption mb-3">문제별 결과</p>
    <div className="flex flex-col gap-2">
      {store.results.map((r, i) => {
        const q = store.questions[i];
        const isOpen = openIndex === i;
        return (
          <div
            key={r.questionUuid}
            className={`bg-surface-card border rounded-[10px] overflow-hidden ${
              r.isCorrect ? "border-border" : "border-red-300"
            }`}
          >
            {/* 카드 헤더 — 클릭 시 아코디언 토글 */}
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 text-left"
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span className={`text-sm font-bold w-5 text-center shrink-0 ${r.isCorrect ? "text-green-600" : "text-red-600"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{q?.stemPreview}</p>
                <p className="text-xs text-text-caption mt-0.5">{formatDuration(r.durationMs)}</p>
              </div>
              {r.isCorrect && <Check size={16} className="text-green-500 shrink-0" />}
            </button>

            {/* 아코디언 본문 — grid-rows 전환으로 300ms ease-out 높이 애니메이션 */}
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="px-3 pb-3 pt-1 border-t border-border">
                  {/* 문제 전체 지문 */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-2">{q?.stemPreview}</p>
                  {/* 선택한 답 및 정답 여부 */}
                  <p className={`text-xs font-medium ${r.isCorrect ? "text-green-600" : "text-red-500"}`}>
                    선택: {r.selectedChoiceKey} — {r.isCorrect ? "정답" : "오답"}
                  </p>
                  {/* 오답일 때만 다시 풀기 버튼 */}
                  {!r.isCorrect && (
                    <Link
                      to={`/questions/${r.questionUuid}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-accent-light rounded-md px-2.5 py-1.5 mt-2"
                    >
                      <RotateCcw size={13} /> 다시 풀기
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
```

- [ ] **Step 3: 브라우저에서 스텝3 아코디언 동작 확인**

스텝3 진입 후:
- 문제 카드 클릭 시 300ms ease-out으로 부드럽게 펼쳐지는지 확인
- 펼쳐진 카드에 문제 지문 전체, "선택: A — 오답" 형태의 텍스트 표시 확인
- 오답 카드 하단에 "다시 풀기" 버튼 표시 확인
- 다른 카드 클릭 시 이전 카드가 닫히고 새 카드가 열리는지 확인
- 이미 열린 카드 클릭 시 닫히는지 확인

- [ ] **Step 4: 커밋**

```bash
git add client/src/pages/PracticeResult.tsx
git commit -m "feat: 결과화면 스텝3 문제별 결과 아코디언 preview 구현 #155"
```

---

## Self-Review

**스펙 커버리지 체크:**
- [x] StepNavigator 헤더 제거 → Task 1
- [x] 인디케이터 상단 이동 → Task 1
- [x] 하단 버튼 텍스트 정리 ("다음", "카테고리 목록으로") → Task 1
- [x] 스텝1 순차 애니메이션 (staggered, 150ms 간격) → Task 2
- [x] 스텝1 아이콘 (Target, Clock, Timer) 회색으로 레이블 앞 → Task 2
- [x] "평균" → "문제당 평균" → Task 2
- [x] 스텝2 AI 분석 뱃지 (Sparkles) → Task 3
- [x] 스텝2 인디고 border 카드 → Task 3
- [x] 스텝3 아코디언 300ms ease-out → Task 4
- [x] 한 번에 하나만 열림 → Task 4
- [x] 오답 카드 "다시 풀기" 버튼 아코디언 내부로 이동 → Task 4

**Placeholder 스캔:** 없음

**타입 일관성:**
- `visibleStats: boolean[]` — Task 2 Step 2에서 정의, Step 3~4에서 사용 일치
- `openIndex: number | null` — Task 4 Step 1에서 정의, Step 2에서 사용 일치
- `r.selectedChoiceKey` — `practiceStore.ts`의 `PracticeResult` 타입에 존재하는 필드 (`stores/practiceStore.ts` 확인 필요, 없으면 `r.selectedChoiceKey ?? "?"` 폴백 처리)

**주의사항:** `r.selectedChoiceKey`가 practiceStore 타입에 정의되어 있는지 구현 전 확인. 없으면 `"선택: -"` 폴백으로 표시할 것.
