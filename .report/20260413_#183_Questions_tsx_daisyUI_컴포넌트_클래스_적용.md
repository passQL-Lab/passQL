### 📌 작업 개요

`Questions.tsx`에 남아있던 커스텀 CSS 클래스(`card-base`, `filter-dropdown`) 2종을 순수 Tailwind 유틸리티로 교체. `filter-dropdown` 은 해당 파일에서만 단독 사용되던 클래스이므로 `components.css`에서도 함께 삭제. `badge-topic`은 passQL 전용 인디고 배지로 유지.

---

### ✅ 구현 내용

#### card-base → Tailwind 유틸리티 교체 (4곳)

- **파일**: `src/pages/Questions.tsx`
- **변경 내용**: 스켈레톤 2곳, 토픽 카드, 문제 카드에서 `card-base` 제거 → `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` 인라인 Tailwind 클래스로 교체
- **이유**: 커스텀 CSS 의존성 제거로 스타일 추적 단순화

#### filter-dropdown → Tailwind 유틸리티 교체 (2곳)

- **파일**: `src/pages/Questions.tsx`
- **변경 내용**: 난이도 필터 버튼의 기본/활성 상태 `filter-dropdown` / `filter-dropdown--active` 제거 → `inline-flex items-center gap-1.5 h-10 px-4 border border-border rounded-full text-sm bg-surface-card` + 조건부 `border-brand bg-brand-light` 클래스로 교체
- **이유**: 해당 클래스가 `Questions.tsx`에서만 단독 사용되어 공용 CSS를 유지할 이유 없음

#### components.css filter-dropdown 스타일 삭제

- **파일**: `src/styles/components.css`
- **변경 내용**: `.filter-dropdown`, `.filter-dropdown:hover`, `.filter-dropdown--active` 3블록 삭제
- **이유**: 유일한 사용처(`Questions.tsx`)에서 Tailwind로 이전 완료되어 데드 코드 제거

---

### 🔧 주요 변경사항 상세

#### 필터 버튼 활성 상태 처리

기존 CSS BEM 방식(`.filter-dropdown--active`) 대신 JSX 템플릿 리터럴로 조건부 클래스 처리:

```tsx
className={`... ${difficulty ? "border-brand bg-brand-light" : ""}`}
```

선택된 난이도가 있을 때 브랜드 인디고 보더와 연한 배경을 적용하는 방식으로 동일한 시각적 효과 유지.

---

### 📌 참고사항

- `badge-topic` 클래스는 passQL 전용 인디고 뱃지로, 이슈 명세에 따라 Tailwind 교체 없이 그대로 유지
- `card-base`는 `QuestionDetail`, `Stats` 등 다른 파일 12곳에서도 사용 중 — 해당 파일들은 별도 이슈에서 순차 처리 예정
