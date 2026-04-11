# Questions 토픽 카드 UI 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토픽 카드의 아이콘을 9개 토픽 코드에 맞게 정확히 매핑하고, 중복 표시되는 토픽명을 제거하며, 카드에 shadow와 hover 인터랙션을 추가한다.

**Architecture:** `topicIcons.ts`의 잘못된 키(`JOIN`, `GROUP_BY` 등)를 실제 API 코드(`sql_join`, `sql_group_aggregate` 등)로 교정하고 fallback 랜덤 로직을 제거한다. `CategoryCards.tsx`에서 중복 캡션 제거와 Tailwind shadow/transition 클래스를 추가한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, lucide-react, Vitest + Testing Library

---

### Task 1: topicIcons.ts — 아이콘 매핑 교정

**Files:**
- Modify: `src/constants/topicIcons.ts`
- Create: `src/constants/topicIcons.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/constants/topicIcons.test.ts` 파일 생성:

```typescript
import { describe, it, expect } from "vitest";
import { getTopicIcon } from "./topicIcons";
import {
  Database, Table, PencilLine, Sigma, Combine,
  Layers, BarChart3, AppWindow, Network, HelpCircle,
} from "lucide-react";

describe("getTopicIcon", () => {
  it("data_modeling → Database", () => {
    expect(getTopicIcon("data_modeling")).toBe(Database);
  });

  it("sql_basic_select → Table", () => {
    expect(getTopicIcon("sql_basic_select")).toBe(Table);
  });

  it("sql_ddl_dml_tcl → PencilLine", () => {
    expect(getTopicIcon("sql_ddl_dml_tcl")).toBe(PencilLine);
  });

  it("sql_function → Sigma", () => {
    expect(getTopicIcon("sql_function")).toBe(Sigma);
  });

  it("sql_join → Combine", () => {
    expect(getTopicIcon("sql_join")).toBe(Combine);
  });

  it("sql_subquery → Layers", () => {
    expect(getTopicIcon("sql_subquery")).toBe(Layers);
  });

  it("sql_group_aggregate → BarChart3", () => {
    expect(getTopicIcon("sql_group_aggregate")).toBe(BarChart3);
  });

  it("sql_window → AppWindow", () => {
    expect(getTopicIcon("sql_window")).toBe(AppWindow);
  });

  it("sql_hierarchy_pivot → Network", () => {
    expect(getTopicIcon("sql_hierarchy_pivot")).toBe(Network);
  });

  it("unknown code → HelpCircle fallback", () => {
    expect(getTopicIcon("unknown_code")).toBe(HelpCircle);
  });

  it("두 번 호출해도 같은 아이콘 반환 (랜덤 아님)", () => {
    expect(getTopicIcon("sql_join")).toBe(getTopicIcon("sql_join"));
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run src/constants/topicIcons.test.ts
```

Expected: FAIL — 현재 키 불일치로 대부분 실패

- [ ] **Step 3: topicIcons.ts 교정**

`src/constants/topicIcons.ts`를 아래 내용으로 교체:

```typescript
import {
  Database, Table, PencilLine, Sigma, Combine,
  Layers, BarChart3, AppWindow, Network, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// 9개 토픽 코드 완전 명시 — fallback 랜덤 로직 제거
const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  data_modeling: Database,
  sql_basic_select: Table,
  sql_ddl_dml_tcl: PencilLine,
  sql_function: Sigma,
  sql_join: Combine,
  sql_subquery: Layers,
  sql_group_aggregate: BarChart3,
  sql_window: AppWindow,
  sql_hierarchy_pivot: Network,
};

export function getTopicIcon(code: string): LucideIcon {
  return TOPIC_ICON_MAP[code] ?? HelpCircle;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run src/constants/topicIcons.test.ts
```

Expected: PASS (10/10)

- [ ] **Step 5: 커밋**

```bash
git add src/constants/topicIcons.ts src/constants/topicIcons.test.ts
git commit -m "fix: topicIcons 키 교정 — 실제 API 코드로 매핑 + fallback 제거 #120"
```

---

### Task 2: CategoryCards.tsx — 중복 캡션 제거 + shadow/hover 추가

**Files:**
- Modify: `src/pages/CategoryCards.tsx`

- [ ] **Step 1: 카드 버튼 클래스 및 구조 변경**

`src/pages/CategoryCards.tsx` line 51–64의 카드 버튼을 아래와 같이 수정:

```tsx
<button
  key={t.code}
  type="button"
  className="card-base flex flex-col items-center text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#4F46E5] transition-all duration-200"
  onClick={() => handleSelect(t.code, t.displayName)}
>
  <div className="w-11 h-11 bg-accent-light rounded-[10px] flex items-center justify-center mb-3">
    <Icon size={22} className="text-brand" />
  </div>
  <span className="text-body font-bold">{t.displayName}</span>
</button>
```

변경 포인트:
- `hover:border-brand transition-colors` → `shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#4F46E5] transition-all duration-200`
- 캡션 `<span className="text-xs text-text-caption mt-1">...</span>` 전체 삭제

- [ ] **Step 2: 빌드 오류 없음 확인**

```bash
npm run build
```

Expected: `✓ built in ...` (에러 없음)

- [ ] **Step 3: 브라우저에서 확인**

```bash
npm run dev
```

`http://localhost:5173` (CategoryCards가 렌더링되는 경로) 에서:
- 각 카드에 올바른 아이콘이 표시되는지 확인
- 토픽명이 한 번만 표시되는지 확인
- 카드 hover 시 살짝 올라오며 그림자 강화되는지 확인
- 보더가 인디고로 전환되는지 확인

- [ ] **Step 4: 커밋**

```bash
git add src/pages/CategoryCards.tsx
git commit -m "feat: 토픽 카드 중복 캡션 제거 + shadow/hover 인터랙션 추가 #120"
```
