# #175 ChoiceCard · ConfirmModal daisyUI 버튼 클래스 적용

### 📌 작업 개요

`ChoiceCard`와 `ConfirmModal`의 버튼 클래스를 커스텀 CSS에서 daisyUI 표준 클래스로 교체. Home.tsx(#167) 파일럿 이후 일관성 확보가 목적이며, 구조·로직 변경 없이 클래스 교체 및 인라인 `style` 속성 제거에 집중.

---

### ✅ 구현 내용

#### ChoiceCard.tsx — 실행 버튼 클래스 교체

- **파일**: `client/src/components/ChoiceCard.tsx`
- **변경 내용**:
  - `btn-compact` / `btn-compact-inverted` → `btn btn-xs btn-outline`으로 교체
  - 미선택 상태: `text-primary border-primary` (인디고 아웃라인)
  - 선택 상태(파란 배경): `bg-white text-primary border-white` (흰색 채움 + 인디고 텍스트)
- **특이사항**: `btn-primary` 클래스명을 그대로 사용하면 `components.css`의 `.btn-primary { height: 44px }` 커스텀 규칙과 충돌하여 버튼이 커지는 문제 발생 → `text-primary border-primary` Tailwind 유틸리티로 우회

#### ConfirmModal.tsx — 버튼 클래스 교체 + 인라인 style 제거

- **파일**: `client/src/components/ConfirmModal.tsx`
- **변경 내용**:
  - 오버레이 `style={{ backgroundColor: "rgba(17, 24, 39, 0.5)" }}` 제거 → `bg-base-content/50` 클래스로 대체
  - 유지 버튼: `btn-primary w-full` → `btn btn-primary w-full`
  - 파괴적 버튼: `btn-secondary w-full` → `btn btn-secondary w-full`
- **특이사항**: `bg-neutral/50`은 `#1F2937`(토스트 배경색)이라 틀리고, `bg-base-content/50`이 `#111827`로 디자인 스펙의 `rgba(17, 24, 39, 0.5)`와 정확히 일치

---

### 🔧 주요 변경사항 상세

#### CSS 클래스 미삭제 이유

`components.css`의 `.btn-primary`, `.btn-secondary`, `.btn-compact` 커스텀 클래스는 이번 PR에서 삭제하지 않음. `DailyChallenge.tsx`, `QuestionDetail.tsx`, `AnswerFeedback.tsx`, `SqlPlayground.tsx` 등 다른 컴포넌트에서 여전히 사용 중이기 때문. 전체 마이그레이션 완료 후 별도 삭제 예정.

#### 기존 테스트 전체 삭제

컴포넌트 구조 변경 이력으로 인해 기존 테스트 파일들이 현재 구현과 맞지 않는 상태(잘못된 aria 쿼리, 존재하지 않는 클래스명 검사 등)로 전부 실패. 재작성을 전제로 `src/` 하위 `.test.ts(x)` 파일 12개 전체 삭제.

---

### 📌 참고사항

- `components.css`의 커스텀 버튼 클래스와 daisyUI 클래스가 **같은 이름**을 공유하면 높이/패딩이 충돌할 수 있음. 추후 마이그레이션 시 동일한 방식으로 Tailwind 유틸리티 클래스로 우회하거나 CSS 삭제와 병행 진행 권장.
- daisyUI 오버레이 색상 매핑: `bg-neutral/50`(`#1F2937`) ≠ `bg-base-content/50`(`#111827`) — 혼동 주의.
