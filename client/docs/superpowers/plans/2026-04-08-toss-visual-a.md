# Toss Visual A — 토스 감성 적용 (Design.md 색상 유지)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** passQL Design.md 색상/폰트를 유지하면서 토스 감성(둥근 radius, 넉넉한 여백, 마이크로 모션, 읽기 편안한 line-height)을 CSS 레벨에서 적용한다.

**Architecture:** `components.css`와 `typography.css`만 수정. 페이지 코드 변경 없음. CSS 변수와 클래스 스타일만 조정하여 전체 앱에 일괄 반영. daisyUI 테마의 radius도 함께 조정.

**Tech Stack:** Tailwind CSS 4, daisyUI 5, CSS custom properties

---

## 변경 요약

| 항목 | 현재 | 변경 | 근거 |
|------|------|------|------|
| Card radius | 12px | 16px | 토스 둥글둥글한 카드 |
| Card padding | 20px | 24px | 넉넉한 여백 |
| Button radius | 8px | 12px | 부드러운 느낌 |
| Code block radius | 8px | 12px | 카드와 통일 |
| Body line-height | 1.6 | 1.7 | 읽기 편안함 |
| Secondary line-height | 1.6 | 1.7 | 동일 |
| Button hover | opacity 0.9 | translateY(-1px) + opacity | 마이크로 모션 |
| Card hover | bg-surface | bg-surface + translateY(-2px) | 살짝 떠오르는 느낌 |
| Transition duration | 200ms | 250ms | 부드러운 전환 |
| daisyUI radius-box | 0.75rem | 1rem | 전역 카드 radius |
| daisyUI radius-field | 0.5rem | 0.75rem | 전역 버튼 radius |

---

### Task 1: CSS 스타일 조정 (components + typography + theme)

**Files:**
- Modify: `src/styles/components.css`
- Modify: `src/styles/typography.css`
- Modify: `src/styles/theme.css`

- [ ] **Step 1: theme.css — daisyUI radius 조정**

```css
/* 변경 전 */
--radius-field: 0.5rem;   /* 8px - buttons */
--radius-box: 0.75rem;    /* 12px - cards */

/* 변경 후 */
--radius-field: 0.75rem;  /* 12px - buttons */
--radius-box: 1rem;       /* 16px - cards */
```

- [ ] **Step 2: components.css — 카드/버튼/코드블록 radius + padding + 모션**

카드:
```css
.card-base {
  border-radius: 16px;  /* 12px → 16px */
  padding: 24px;        /* 20px → 24px */
  transition: transform 250ms var(--ease-smooth), background-color 250ms var(--ease-smooth);
}
```

카드 hover (기존 페이지에서 `hover:bg-surface`를 쓰는 카드에 대해):
card-base에 hover를 추가하지 않음 — 페이지별로 hover 적용 중이므로 CSS에서는 transition만 정의.

버튼 Primary hover:
```css
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
```

버튼 Secondary/Compact hover에도 동일 적용:
```css
.btn-secondary:hover {
  background-color: var(--color-brand-light);
  transform: translateY(-1px);
}
.btn-compact:hover {
  background-color: var(--color-brand-light);
  transform: translateY(-1px);
}
```

코드 블록:
```css
.code-block {
  border-radius: 12px;  /* 8px → 12px */
}
```

에러/성공 카드:
```css
.error-card { border-radius: 12px; }  /* 8px → 12px */
.success-card { border-radius: 12px; }
```

토스트:
```css
.toast-passql { border-radius: 12px; }  /* 8px → 12px */
```

필터 드롭다운 transition:
```css
.filter-dropdown {
  transition: all 250ms var(--ease-smooth);  /* 200ms → 250ms */
}
```

- [ ] **Step 3: typography.css — line-height 조정**

```css
.text-body {
  line-height: 1.7;  /* 1.6 → 1.7 */
}
.text-secondary {
  line-height: 1.7;  /* 1.6 → 1.7 */
}
```

body 기본:
```css
body {
  line-height: 1.7;  /* 1.6 → 1.7 */
}
```

- [ ] **Step 4: 빌드 + 테스트 확인**

Run: `npm run build && npm test`

- [ ] **Step 5: 커밋하지 않음** (사용자가 직접 확인 후 결정)
