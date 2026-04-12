# 오늘의 문제 완료 카드 디자인 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Home.tsx`의 오늘의 문제 완료 상태 카드에서 왼쪽 초록 굵은선을 제거하고, 회색 dimmed 카드 + 우측 상단 "완료" 텍스트 레이블로 교체한다.

**Architecture:** `src/pages/Home.tsx` 단일 파일의 `today.alreadySolvedToday === true` 분기 블록만 수정. 컴포넌트 추출 없이 인라인 JSX 교체로 처리.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, lucide-react

---

### Task 1: 완료 카드 JSX 교체

**Files:**
- Modify: `src/pages/Home.tsx:116-133`

현재 코드 (116~133줄):
```tsx
// 완료 상태: 성공 카드 스타일 (초록 left border + 배경)
<div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-sem-success-light border-l-4 border-sem-success">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-sem-success-text">
      오늘의 문제
    </p>
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-sem-success">
      <Check size={14} className="text-white" />
    </div>
  </div>
  <p className="text-body text-sm truncate">
    {today.question.stemPreview}
  </p>
  <div className="flex items-center gap-2 mt-auto">
    <span className="badge-topic">{today.question.topicName}</span>
    <StarRating level={today.question.difficulty} />
  </div>
</div>
```

- [ ] **Step 1: 완료 카드 블록 교체**

`src/pages/Home.tsx` 116~133줄을 아래로 교체:

```tsx
{/* 완료 상태: 회색 dimmed 카드 — 이미 끝난 항목임을 시각적으로 표현 */}
<div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-[#F3F4F6] border border-border">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-text-caption">
      오늘의 문제
    </p>
    {/* 완료 인디케이터: 원형 아이콘 대신 텍스트 레이블 */}
    <span className="flex items-center gap-1 text-xs font-semibold text-sem-success-text">
      <Check size={11} strokeWidth={3} />
      완료
    </span>
  </div>
  <p className="text-text-caption text-sm truncate">
    {today.question.stemPreview}
  </p>
  <div className="flex items-center gap-2 mt-auto">
    <span className="badge-topic opacity-50">{today.question.topicName}</span>
    <span className="opacity-40"><StarRating level={today.question.difficulty} /></span>
  </div>
</div>
```

- [ ] **Step 2: 브라우저에서 홈 화면 확인**

```bash
npm run dev
```

확인 항목:
- 완료 상태일 때: 회색 배경, 왼쪽 선 없음, 균일한 `rounded-xl`, 우측 상단 "✓ 완료" 레이블
- 미완료 상태일 때: 기존 흰색 카드 변화 없음
- 옆 시험 일정 카드와 높이 정렬 이상 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Home.tsx
git commit -m "design: 오늘의 문제 완료 카드 회색 dimmed 스타일로 교체 #167"
```
