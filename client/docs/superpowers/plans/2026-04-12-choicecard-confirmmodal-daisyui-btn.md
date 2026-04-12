# ChoiceCard · ConfirmModal daisyUI 버튼 클래스 적용 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ChoiceCard와 ConfirmModal의 버튼 클래스를 daisyUI로 교체하고 인라인 style 속성을 제거해 Home.tsx와 일관된 스타일링 체계를 갖춘다.

**Architecture:** 구조 변경 없이 className 문자열만 교체. `components.css`의 커스텀 클래스는 다른 컴포넌트가 여전히 사용 중이므로 이번 PR에서 삭제하지 않는다.

**Tech Stack:** React 19, Tailwind CSS 4, daisyUI 5

**Spec:** `docs/superpowers/specs/2026-04-12-choicecard-confirmmodal-daisyui-btn-design.md`

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/components/ChoiceCard.tsx` | Modify | 실행 버튼 className 교체 |
| `src/components/ConfirmModal.tsx` | Modify | 버튼 2개 className 교체 + 인라인 style 제거 |

---

### Task 1: ChoiceCard.tsx 실행 버튼 클래스 교체

**Files:**
- Modify: `src/components/ChoiceCard.tsx:79`

- [ ] **Step 1: 현재 코드 확인**

`src/components/ChoiceCard.tsx` 79번째 줄:
```tsx
className={`btn-compact ${isSelected ? "btn-compact-inverted" : ""}`}
```

- [ ] **Step 2: 클래스 교체**

아래와 같이 수정:
```tsx
className={`btn btn-xs btn-outline btn-primary${isSelected ? " text-white border-white" : ""}`}
```

완성된 버튼 전체 컨텍스트:
```tsx
<button
  className={`btn btn-xs btn-outline btn-primary${isSelected ? " text-white border-white" : ""}`}
  type="button"
  onClick={() => onExecute(choice.key, choice.body)}
  disabled={!!cached || isExecuting}
>
  {isExecuting ? "실행 중..." : "실행"}
</button>
```

- [ ] **Step 3: 개발 서버에서 시각 확인**

```bash
npm run dev
```

확인 항목:
- 미선택 ChoiceCard의 실행 버튼: 인디고 테두리 + 인디고 텍스트
- 선택된 ChoiceCard(brand 배경)의 실행 버튼: 흰색 테두리 + 흰색 텍스트
- disabled 상태(실행 후): 버튼 비활성화 표시

- [ ] **Step 4: 커밋**

```bash
git add src/components/ChoiceCard.tsx
git commit -m "design: ChoiceCard 실행 버튼 btn-compact → daisyUI btn-xs 클래스 적용 #175"
```

---

### Task 2: ConfirmModal.tsx 버튼 클래스 교체 + 인라인 style 제거

**Files:**
- Modify: `src/components/ConfirmModal.tsx:47,66,74`

- [ ] **Step 1: 오버레이 div 인라인 style 제거 (line 47)**

Before:
```tsx
<div
  className="fixed inset-0 z-50 flex items-end justify-center"
  style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}
  onClick={onCancel}
>
```

After:
```tsx
<div
  className="fixed inset-0 z-50 flex items-end justify-center bg-base-content/50"
  onClick={onCancel}
>
```

- [ ] **Step 2: 유지 버튼 클래스 교체 (line 66)**

Before:
```tsx
<button
  type="button"
  className="btn-primary w-full"
  onClick={onCancel}
>
```

After:
```tsx
<button
  type="button"
  className="btn btn-primary w-full"
  onClick={onCancel}
>
```

- [ ] **Step 3: 파괴적 버튼 클래스 교체 (line 74)**

Before:
```tsx
<button
  type="button"
  className="btn-secondary w-full"
  onClick={onConfirm}
>
```

After:
```tsx
<button
  type="button"
  className="btn btn-secondary w-full"
  onClick={onConfirm}
>
```

- [ ] **Step 4: 개발 서버에서 시각 확인**

```bash
npm run dev
```

확인 항목:
- 모달 오버레이: 반투명 어두운 배경 (`rgba(17, 24, 39, 0.5)` 동일)
- 유지 버튼 (`cancelLabel`): 인디고 solid 버튼, full width
- 파괴적 버튼 (`confirmLabel`): 인디고 outline 버튼, full width
- ESC 키로 모달 닫기 동작 유지

모달을 직접 띄우는 진입점: 문제 상세 페이지에서 뒤로가기 시도 시 표시됨

- [ ] **Step 5: 커밋**

```bash
git add src/components/ConfirmModal.tsx
git commit -m "design: ConfirmModal 버튼 daisyUI 클래스 적용 + 인라인 style 제거 #175"
```
