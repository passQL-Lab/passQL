# ChoiceCard · ConfirmModal daisyUI 버튼 클래스 적용 설계

- **이슈**: #175
- **날짜**: 2026-04-12
- **브랜치**: 20260412_#175_ChoiceCard_ConfirmModal_daisyUI_버튼_클래스_적용

---

## 배경

Home.tsx에서 버튼 클래스를 daisyUI로 전환한 이후, `ChoiceCard`와 `ConfirmModal`은 커스텀 CSS 클래스(`btn-compact`, `btn-primary`, `btn-secondary`)를 그대로 사용하고 있어 일관성이 깨진 상태다. 이번 작업으로 두 컴포넌트를 daisyUI 클래스로 통일하고, 더 이상 사용되지 않는 커스텀 CSS 룰을 삭제한다.

---

## 목표

- 커스텀 버튼 클래스 → daisyUI 클래스로 교체
- 인라인 `style` 속성 제거 → Tailwind 유틸리티 클래스로 대체
- 사용하지 않는 커스텀 CSS 룰 삭제
- 구조 변경 없이 클래스 교체만 진행

---

## 변경 범위

### 1. `src/components/ChoiceCard.tsx`

**실행 버튼 (line 79)**

```tsx
// Before
className={`btn-compact ${isSelected ? "btn-compact-inverted" : ""}`}

// After
className={`btn btn-xs btn-outline btn-primary${isSelected ? " text-white border-white" : ""}`}
```

- `btn btn-xs btn-outline btn-primary`: Home.tsx와 동일한 daisyUI 패턴
- `isSelected` 시 `text-white border-white`: brand 배경 위에서 흰색 반전 — 기존 `btn-compact-inverted` 효과와 동일

---

### 2. `src/components/ConfirmModal.tsx`

**오버레이 div (line 47) — 인라인 style 제거**

```tsx
// Before
<div
  className="fixed inset-0 z-50 flex items-end justify-center"
  style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}
  onClick={onCancel}
>

// After
<div
  className="fixed inset-0 z-50 flex items-end justify-center bg-neutral/50"
  onClick={onCancel}
>
```

- `bg-neutral/50`: daisyUI 테마의 `--color-neutral(#1F2937)` + 50% 불투명도 → `rgba(17, 24, 39, 0.5)`와 동일

**유지 버튼 (line 66)**

```tsx
// Before
className="btn-primary w-full"

// After
className="btn btn-primary w-full"
```

**파괴적 버튼 (line 74)**

```tsx
// Before
className="btn-secondary w-full"

// After
className="btn btn-secondary w-full"
```

---

### 3. `src/styles/components.css` — 이번 PR 범위 외

`btn-primary`, `btn-compact` 클래스가 아직 다른 컴포넌트에서 사용 중이므로 **이번 PR에서 CSS 삭제 불가**.

잔존 사용처:
- `btn-primary`: `DailyChallenge.tsx`, `QuestionDetail.tsx`, `AnswerFeedback.tsx`
- `btn-compact`: `AnswerFeedback.tsx`, `SqlPlayground.tsx`, `ErrorFallback.tsx`

CSS 삭제는 위 파일들의 마이그레이션이 완료된 후 별도 PR에서 진행한다.

---

## 작업 순서

1. `ChoiceCard.tsx` 클래스 교체
2. `ConfirmModal.tsx` 클래스 교체 + 인라인 style 제거
3. 브라우저에서 시각 확인 (선택/미선택 상태, 모달 오버레이)

---

## 확인 체크리스트

- [ ] ChoiceCard 미선택 상태: `btn-outline btn-primary` (인디고 테두리+텍스트)
- [ ] ChoiceCard 선택 상태: `text-white border-white` (흰색 테두리+텍스트)
- [ ] ConfirmModal 오버레이: 반투명 어두운 배경 유지
- [ ] ConfirmModal 유지 버튼: 인디고 solid 버튼
- [ ] ConfirmModal 파괴적 버튼: 인디고 outline 버튼
- [ ] JSX 인라인 style 속성 없음
