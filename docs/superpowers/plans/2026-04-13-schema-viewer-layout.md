# SchemaViewer Layout Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SchemaViewer 컴포넌트의 테이블 레이아웃을 개선한다 — 배경색 누락, 가로 잘림, 테이블 식별 어려움 문제를 해결한다.

**Architecture:** 세로 스택(space-y-3) 구조로 각 테이블 카드를 독립 배치하고, 카드 내부에만 overflow-x-auto를 적용해 칼럼이 많아도 잘리지 않게 한다. 테이블 헤더에 Table2 아이콘을 추가해 테이블임을 시각적으로 명확히 표현하고, 카드 배경을 bg-white로 명시한다.

**Tech Stack:** React, Tailwind CSS 4, lucide-react, passQL Design System

---

### Task 1: SchemaViewer 레이아웃 및 스타일 개선

**Files:**
- Modify: `client/src/components/SchemaViewer.tsx`

- [ ] **Step 1: Table2 아이콘 import 추가**

`client/src/components/SchemaViewer.tsx` 상단 import를 수정한다.

```tsx
import { ChevronDown, ChevronUp, Table2 } from "lucide-react";
```

- [ ] **Step 2: 테이블 목록 컨테이너 — flex → 세로 스택으로 변경**

기존 `:141` 라인:
```tsx
<div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory" }}>
```

변경 후:
```tsx
<div className="space-y-3">
```

- [ ] **Step 3: 각 테이블 카드 래퍼 — scrollSnap 제거, 카드 구조 유지**

기존 `:147` 라인:
```tsx
<div key={table.tableName} className="w-full min-w-0 space-y-2" style={{ scrollSnapAlign: "start" }}>
```

변경 후:
```tsx
<div key={table.tableName} className="space-y-2">
```

- [ ] **Step 4: 스키마 구조 카드 — 배경색 추가 + 내부 가로 스크롤**

기존 `:149~152` 라인:
```tsx
<div
  className="overflow-hidden rounded-xl border"
  style={{ borderColor: "var(--color-border)" }}
>
```

변경 후:
```tsx
<div
  className="rounded-xl border overflow-hidden"
  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-card)" }}
>
```

- [ ] **Step 5: 테이블 헤더 — Table2 아이콘 + 테이블명으로 변경**

기존 `:153~160` 라인:
```tsx
<div
  className="px-2 py-0.5 text-sm font-bold font-mono"
  style={{
    backgroundColor: "var(--color-accent-light)",
    color: "var(--color-brand)",
    borderBottom: "1px solid var(--color-border)",
  }}
>
  {table.tableName}
</div>
```

변경 후:
```tsx
<div
  className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold font-mono"
  style={{
    backgroundColor: "var(--color-accent-light)",
    color: "var(--color-brand)",
    borderBottom: "1px solid var(--color-border)",
  }}
>
  <Table2 size={14} />
  {table.tableName}
</div>
```

- [ ] **Step 6: 스키마 구조 테이블 — overflow-x-auto 래퍼 추가**

기존 `:163` 라인:
```tsx
<table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
```

이 `<table>` 태그를 `<div>`로 감싸 가로 스크롤 적용:
```tsx
<div className="overflow-x-auto">
  <table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
    {/* 기존 tbody 내용 그대로 유지 */}
  </table>
</div>
```

- [ ] **Step 7: 샘플 데이터 카드 — 배경색 추가 + 내부 가로 스크롤**

기존 `:193~197` 라인:
```tsx
<div
  className="overflow-hidden rounded-xl border"
  style={{ borderColor: "var(--color-border)" }}
>
  <table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
```

변경 후:
```tsx
<div
  className="rounded-xl border overflow-hidden"
  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-card)" }}
>
  <div className="overflow-x-auto">
    <table className="text-sm whitespace-nowrap w-full" style={{ borderCollapse: "collapse" }}>
```

닫는 태그도 맞춰서 `</div>` 하나 추가.

- [ ] **Step 8: 변경 결과 육안 확인**

개발 서버에서 스키마가 있는 문제를 열어 아래 항목 확인:
- 테이블 카드에 흰 배경이 보이는가
- 테이블 헤더에 Table2 아이콘 + 테이블명이 표시되는가
- 칼럼이 많을 때 카드 내부에서 가로 스크롤이 작동하는가
- 테이블이 4개일 때 세로로 쌓여 각각 식별되는가
