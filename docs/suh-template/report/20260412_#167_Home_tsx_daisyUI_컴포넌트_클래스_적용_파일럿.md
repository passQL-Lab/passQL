### 📌 작업 개요

daisyUI 5가 설치되어 있고 passql 커스텀 테마가 정의되어 있음에도, 실제 컴포넌트에서 daisyUI 클래스를 사용하지 않던 문제 개선.
`Home.tsx`를 파일럿으로 삼아 1:1 대체 가능한 요소를 daisyUI 컴포넌트 클래스로 교체하고,
daisyUI 테마의 `base-100` / `base-200` 색상 매핑도 디자인 시스템에 맞게 정렬.
추가로 `useStagger` 훅의 `style` prop 의존 제거, 오늘의 문제 완료 카드 디자인 개선도 함께 진행.

---

### 🎯 구현 목표

- `Home.tsx`에서 수동 커스텀 클래스로 구현된 카드, 버튼, 뱃지, 스켈레톤을 daisyUI 클래스로 교체
- passQL 전용 클래스(`badge-topic`, 시맨틱 카드 등)는 유지하고 구조 변경 최소화
- daisyUI `base-100` = `#FFFFFF` (카드 표면), `base-200` = `#FAFAFA` (페이지 배경) 매핑 정렬
- `useStagger` 훅에서 `style` prop 제거 → Tailwind CSS 4 임의 변수 클래스로 전환
- 오늘의 문제 완료 카드: 왼쪽 초록 굵은선 → 회색 dimmed 카드로 교체

---

### ✅ 구현 내용

#### daisyUI 테마 base 색상 매핑 수정

- **파일**: `src/styles/theme.css`
- **변경 내용**:
  - `--color-base-100`: `oklch(100% 0 0)` → `#FFFFFF` (카드/컴포넌트 표면)
  - `--color-base-200`: `oklch(98.2% 0 0)` → `#FAFAFA` (페이지 배경)
- **이유**: daisyUI의 `bg-base-100`/`bg-base-200` 유틸리티가 디자인 시스템의 Surface 계층(카드=흰색, 페이지=연회색)과 1:1로 대응하도록 정렬

#### 카드 컴포넌트: `card-base` → `card` 전환

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: 수동 정의된 `card-base` CSS 클래스를 daisyUI `card` 클래스로 교체
- **이유**: `card-base`는 border, radius, padding, transition을 직접 정의한 커스텀 클래스. daisyUI `card`가 passql 테마 `--radius-box`와 `--color-base-100`을 자동 참조하므로 동일한 시각 결과를 더 짧은 클래스로 표현 가능

#### 로딩 스켈레톤: 수동 pulse → `skeleton` 전환

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: `animate-pulse bg-border` 등의 수동 조합을 daisyUI `skeleton` 단일 클래스로 교체
- **이유**: daisyUI `skeleton`이 passql 테마 색상으로 자동 렌더링되므로 별도 색상 지정 불필요. 스켈레톤 영역 h-16, h-24 등 크기만 유지

#### 재시도 버튼: `btn btn-xs btn-outline btn-primary` 전환

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: 수동 border + padding 조합 버튼을 `btn btn-xs btn-outline btn-primary` 클래스로 교체
- **이유**: daisyUI `btn` + size/variant 조합이 passql 테마 `--color-primary`와 `--radius-field`를 참조하므로 디자인 일관성 유지하면서 클래스 축소

#### 연속 학습 뱃지: `badge badge-warning` 전환

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: `inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold bg-sem-warning-light text-sem-warning-text` 수동 조합을 `badge badge-warning` + 내부 아이콘으로 교체
- **이유**: daisyUI `badge-warning`이 passql 테마 `--color-warning` / `--color-warning-content`를 자동 참조하므로 수동 색상 클래스 제거 가능

#### useStagger: style prop 제거 → Tailwind CSS 변수 클래스 전환

- **파일**: `src/hooks/useStagger.ts`
- **변경 내용**: 기존 반환값 `{ className, style: { '--stagger-delay': '...' } }` → `{ className: 'animate-stagger [--stagger-delay:${n}ms]' }` 단일 객체로 축소
- **이유**: Tailwind CSS 4의 임의 CSS 변수 구문 `[--stagger-delay:Nms]`을 활용하면 `style` prop 없이 className 단독으로 CSS 변수 주입 가능. JSX에서 `style={s.style}` 스프레드 제거로 인라인 style 속성 완전 제거 — CLAUDE.md 인라인 style 금지 규칙 준수

#### 오늘의 문제 완료 카드 디자인 개선

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: `alreadySolvedToday === true` 분기 블록의 완료 상태 카드 교체
  - 제거: `bg-sem-success-light border-l-4 border-sem-success` + 초록 원형 체크 아이콘
  - 적용: `bg-[#F3F4F6] border border-border rounded-xl` + `✓ 완료` 텍스트 레이블, 문제 텍스트/뱃지/별점 dimmed
- **이유**: 왼쪽 굵은선(`border-l-4`)이 카드 좌측 `rounded-xl`을 시각적으로 깨뜨리는 문제 해결. 시맨틱 카드 패턴(SQL 에러 결과 전용)을 완료 상태에 오용하던 맥락 불일치 해소

#### fix: 뱃지 색상 복원 및 레이아웃 수정

- **파일**: `src/pages/Home.tsx`
- **변경 내용**: daisyUI 클래스 전환 후 발생한 시각 회귀 수정
  - `badge-warning` 적용 후 `badge-topic` 색상이 daisyUI 기본값으로 오염된 문제 복원
  - 카드 `bg-white` 명시적 적용 — daisyUI `card`의 기본 배경이 `base-100`으로 fallback되는 케이스 방어
  - 추천 문제 카드 `flex-row` 정렬 틀어짐 수정

---

### 🔧 주요 변경사항 상세

#### passQL 전용 클래스 유지 범위

다음 클래스는 daisyUI 대체 대상에서 제외:
- `badge-topic`: 토픽 태그 전용 인디고 뱃지 — daisyUI 기본 variant와 시각적 구분 필요
- 시맨틱 카드(`error-card`, `modal-card`): 좌측 4px border + 시맨틱 색상 배경 구조 — daisyUI card 변형으로 표현 불가
- typography 클래스(`text-heading`, `text-body`, `text-caption` 등): 폰트 스케일 전용

#### daisyUI base 색상 계층 전략

passQL 디자인 시스템의 3단계 Surface 계층을 daisyUI base scale에 매핑:
- `base-200` = `#FAFAFA` — 페이지 배경 (`<body>`, `<main>`)
- `base-100` = `#FFFFFF` — 카드/컴포넌트 표면 (`card`, 사이드바)
- `base-300` = `#E5E7EB` — 테두리/구분선

이 매핑으로 `bg-base-100`, `bg-base-200` 유틸리티를 하드코딩 없이 사용 가능.

---

### 🧪 테스트 및 검증

- 홈 화면 카드 영역 시각 동일성 확인 (border, radius, padding 유지)
- 로딩 상태에서 skeleton 애니메이션 정상 표시 확인
- 재시도 버튼 outline/primary 스타일 확인
- 연속 학습 뱃지 warning 색상 및 불꽃 아이콘 정상 표시 확인
- passQL 전용 클래스(`badge-topic` 등) 시각 변화 없음 확인

---

### 📌 참고사항

- 이번 작업은 `Home.tsx` 파일럿으로 한정. 다른 페이지/컴포넌트는 후속 이슈에서 순차 적용 예정
- `card-base` CSS 클래스는 Home.tsx에서 제거 후에도 다른 컴포넌트가 참조할 수 있으므로 `components.css`에서 즉시 삭제하지 않음
- daisyUI `card`는 기본적으로 `overflow-hidden`을 포함하므로 카드 내부 요소 clipping 여부 확인 필요
- `useStagger` 반환 타입이 변경되었으므로(`style` 필드 제거), 다른 페이지(`CategoryCards.tsx`, `Settings.tsx`, `Stats.tsx`)에서 `style` prop 스프레드를 사용 중이라면 동일하게 수정 필요
