# Settings Flat UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settings 페이지 flat 스타일 A 레이아웃 기준으로 row 타이포·패딩·섹션 그룹 배경을 개선해 iOS/토스 설정 화면 수준의 완성도를 높인다.

**Architecture:** SettingsRow(패딩·label 타이포) → SettingsSection(라벨 여백) → Settings+DevPage(그룹 배경 border-y) 순서로 컴포넌트 단위 개선. 각 단계는 독립 커밋.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5

---

## 파일 맵

| 파일 | 변경 유형 | 책임 |
|------|-----------|------|
| `src/components/SettingsRow.tsx` | Modify | row 패딩·label 타이포 조정 |
| `src/components/SettingsSection.tsx` | Modify | 섹션 라벨 하단 여백 조정 |
| `src/pages/Settings.tsx` | Modify | 그룹 wrapper에 white bg + border-y 추가 |
| `src/pages/DevPage.tsx` | Modify | 동일 그룹 wrapper 패턴 동기화 |

---

## Task 1: SettingsRow — label 타이포 & 패딩 조정

**Files:**
- Modify: `src/components/SettingsRow.tsx`

현재 label이 `text-sm text-text-secondary`(14px)로 value와 크기 차이가 작아 위계가 약함.
`text-xs text-text-caption`(12px)으로 줄여 value가 더 도드라지게 하고,
패딩도 `px-5 py-4` → `px-4 py-3.5`로 살짝 타이트하게 조정.

- [ ] **Step 1: SettingsRow label + 패딩 수정**

`src/components/SettingsRow.tsx` 전체를 아래로 교체:

```tsx
import type { ReactNode } from "react";

interface SettingsRowProps {
  readonly label: string;
  readonly value: ReactNode;
  /** 우측 아이콘 버튼 영역 (Copy, RefreshCw 등) */
  readonly action?: ReactNode;
  /** 클릭 핸들러 - 제공되면 row 전체가 인터랙티브 */
  readonly onClick?: () => void;
}

/**
 * 설정 페이지 flat 스타일 row
 * - label: 12px caption 색상 (secondary descriptor — 작고 흐릿하게)
 * - value: 메인 콘텐츠 (ReactNode)
 * - action: 우측 아이콘 버튼 (선택사항)
 * - 구분선은 부모의 divide-y로 처리
 */
export default function SettingsRow({ label, value, action, onClick }: SettingsRowProps) {
  const baseClass = `flex items-center justify-between px-4 py-3.5 w-full text-left${
    onClick ? " cursor-pointer hover:bg-surface active:bg-surface transition-colors" : ""
  }`;

  const content = (
    <>
      <div className="min-w-0 flex-1">
        {/* label: xs + caption 색상 — value의 보조 설명자 역할 */}
        <p className="text-xs text-text-caption">{label}</p>
        <div className="mt-0.5">{value}</div>
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/SettingsRow.tsx
git commit -m "refactor: SettingsRow label xs·caption 색상, 패딩 py-3.5 px-4 조정 #211"
```

---

## Task 2: SettingsSection — 섹션 라벨 여백 조정

**Files:**
- Modify: `src/components/SettingsSection.tsx`

현재 `mb-1`(4px)로 라벨과 row 그룹 사이 여백이 너무 좁음.
`mb-2`(8px)로 늘려 라벨이 그룹을 제목처럼 소유하는 느낌 강화.

- [ ] **Step 1: SettingsSection mb-1 → mb-2 수정**

`src/components/SettingsSection.tsx`:

```tsx
import type { ReactNode } from "react";

interface SettingsSectionProps {
  readonly label: string;
  readonly count?: number;
  readonly children: ReactNode;
  readonly isFirst?: boolean;
  readonly className?: string;
}

/**
 * 설정 페이지 섹션 헤더 래퍼 (flat 스타일)
 * - iOS/토스 패턴: 소문자 회색 라벨만, 섹션 간 여백으로 위계 표현
 */
export default function SettingsSection({
  label,
  children,
  isFirst,
  className,
}: SettingsSectionProps) {
  return (
    <div className={[isFirst ? "" : "mt-6", className ?? ""].filter(Boolean).join(" ")}>
      {/* 섹션 라벨 — 아래 여백 8px로 그룹 소유감 확보 */}
      <p className="text-sm text-text-caption px-1 mb-2">{label}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/SettingsSection.tsx
git commit -m "refactor: SettingsSection 섹션 라벨 하단 여백 mb-1 → mb-2 #211"
```

---

## Task 3: Settings.tsx + DevPage.tsx — 그룹 배경 white + border-y 추가

**Files:**
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/DevPage.tsx`

현재 row 그룹이 `divide-y divide-border`만 있어 페이지 배경(`#FAFAFA`)과 row가 구분이 안 됨.
`bg-surface-card border-y border-border`를 추가해 각 섹션 그룹이 흰 띠로 떠오르는 iOS grouped table 패턴 완성.

- [ ] **Step 1: Settings.tsx 그룹 wrapper 클래스 3곳 모두 수정**

`src/pages/Settings.tsx`에서 `divide-y divide-border` 3곳을 모두 아래로 교체:

```
변경 전: <div className="divide-y divide-border">
변경 후: <div className="bg-surface-card border-y border-border divide-y divide-border">
```

총 3곳 (계정 섹션, 이용안내 섹션, 앱 정보 섹션) 모두 동일하게 교체.

- [ ] **Step 2: DevPage.tsx 그룹 wrapper 클래스 수정**

`src/pages/DevPage.tsx`:

```
변경 전: <div className="divide-y divide-border">
변경 후: <div className="bg-surface-card border-y border-border divide-y divide-border">
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/pages/Settings.tsx src/pages/DevPage.tsx
git commit -m "refactor: Settings·DevPage 섹션 그룹 bg-surface-card border-y 추가 — iOS grouped table 패턴 #211"
```

---

## Task 4: Settings.tsx — 섹션 간 mt-6 중복 제거 및 footer 여백 정리

**Files:**
- Modify: `src/pages/Settings.tsx`

현재 각 `<section>`에 `mt-6`이 직접 붙어 있고 `SettingsSection`에도 `mt-6`이 있어 여백이 이중으로 적용될 수 있음. section 태그의 인라인 `mt-6`을 제거하고 `SettingsSection`의 `isFirst` / `mt-6` 로직에 위임.

- [ ] **Step 1: section 태그 인라인 mt-6 제거**

`src/pages/Settings.tsx` 중 아래 두 줄에서 `mt-6` 제거:

```tsx
// 변경 전
<section className={`mt-6 ${s2.className}`}>
// 변경 후
<section className={s2.className}>

// 변경 전
<section className={`mt-6 ${s3.className}`}>
// 변경 후
<section className={s3.className}>
```

(SettingsSection의 `isFirst` 없는 경우 이미 `mt-6`을 붙이므로 section에 중복 불필요)

- [ ] **Step 2: footer 여백 mt-8 → mt-12 조정**

로고 + 카피라이트 섹션에 여백 추가:

```tsx
// 변경 전
<section className={`text-center mt-8 space-y-2 ${s4.className}`}>
// 변경 후
<section className={`text-center mt-12 space-y-2 ${s4.className}`}>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/pages/Settings.tsx
git commit -m "refactor: Settings section mt-6 중복 제거, footer 여백 mt-12 #211"
```
