# Emoji to Lucide Icons Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코드 내 모든 이모지를 lucide-react SVG 아이콘으로 교체하여 일관된 아이콘 시스템 구축

**Architecture:** lucide-react 패키지를 설치하고, AppLayout의 네비게이션 아이콘과 Home의 스트릭 뱃지 아이콘을 Lucide 컴포넌트로 교체. Questions의 ★/☆도 Lucide Star 아이콘으로 교체.

**Tech Stack:** lucide-react, React 19, TypeScript

---

### Task 1: lucide-react 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 패키지 설치**

```bash
npm install lucide-react
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: lucide-react 패키지 추가 #9"
```

---

### Task 2: AppLayout 네비게이션 아이콘 교체

**Files:**
- Modify: `src/components/AppLayout.tsx`

현재 이모지 → Lucide 아이콘 매핑:
- `🏠` → `Home`
- `📝` → `FileText`
- `📊` → `BarChart3`
- `⚙️` → `Settings`

- [ ] **Step 1: NAV_ITEMS의 icon 필드를 Lucide 컴포넌트로 교체**

```tsx
import { Home, FileText, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ...

const NAV_ITEMS: readonly { readonly to: string; readonly label: string; readonly icon: LucideIcon }[] = [
  { to: "/", label: "홈", icon: Home },
  { to: "/questions", label: "문제", icon: FileText },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/settings", label: "설정", icon: Settings },
] as const;
```

- [ ] **Step 2: SidebarNav에서 아이콘 렌더링 수정**

기존:
```tsx
<span>{item.icon}</span>
```

변경:
```tsx
<item.icon size={20} />
```

- [ ] **Step 3: BottomTabNav에서 아이콘 렌더링 수정**

기존:
```tsx
<span className="text-lg">{item.icon}</span>
```

변경:
```tsx
<item.icon size={20} />
```

- [ ] **Step 4: 빌드 및 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add src/components/AppLayout.tsx
git commit -m "refactor: 네비게이션 이모지를 Lucide 아이콘으로 교체 #9"
```

---

### Task 3: Home 스트릭 뱃지 아이콘 교체

**Files:**
- Modify: `src/pages/Home.tsx`

현재 이모지 → Lucide 아이콘 매핑:
- `🔥` → `Flame`

- [ ] **Step 1: Flame 아이콘 import 및 교체**

기존:
```tsx
🔥 연속 {MOCK_STREAK}일
```

변경:
```tsx
import { Flame } from "lucide-react";

// ...
<Flame size={16} className="inline" /> 연속 {MOCK_STREAK}일
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Home.tsx
git commit -m "refactor: 홈 화면 이모지를 Lucide 아이콘으로 교체 #9"
```

---

### Task 4: Questions 별점 아이콘 교체

**Files:**
- Modify: `src/pages/Questions.tsx`

현재 ★/☆ 유니코드 → Lucide `Star` 아이콘 (fill/outline 구분)

- [ ] **Step 1: StarRating 컴포넌트를 Lucide Star로 교체**

기존:
```tsx
<span className="text-sm tracking-wide" style={{ color: "var(--color-sem-warning)" }}>
  {"★".repeat(level)}
  {"☆".repeat(3 - level)}
</span>
```

변경:
```tsx
import { Star } from "lucide-react";

function StarRating({ level }: { readonly level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < level ? "fill-[var(--color-sem-warning)] text-[var(--color-sem-warning)]" : "text-border"}
        />
      ))}
    </span>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/pages/Questions.tsx
git commit -m "refactor: 문제 목록 별점 이모지를 Lucide Star 아이콘으로 교체 #9"
```

---

### Task 5: 이모지 잔여 검증

- [ ] **Step 1: 코드베이스에서 이모지 잔여 확인**

```bash
grep -rn '[\x{1F300}-\x{1F9FF}]' src/ || echo "No emoji found"
```

Expected: "No emoji found" — 이모지 없음 확인

- [ ] **Step 2: 최종 빌드 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공
