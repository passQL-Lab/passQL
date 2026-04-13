# card-base 커스텀 CSS → Tailwind 유틸리티 교체

**이슈**: [#187](https://github.com/passQL-Lab/passQL/issues/187)

---

### 📌 작업 개요

`#183` 작업(Questions.tsx) 이후 코드베이스에 남아있던 `card-base` 커스텀 CSS 클래스 15곳을 순수 Tailwind 유틸리티로 교체하고, `components.css`의 `.card-base` 스타일 블록 삭제. 코드 리뷰에서 발견된 인라인 `style={{ }}` 위반 및 하드코딩 hex 색상도 함께 수정.

---

### 🎯 구현 목표

- `card-base` 사용처 전수 교체 → `bg-surface-card border border-border rounded-2xl p-4 sm:p-6`
- CSS 커스텀 클래스 의존성 제거, Tailwind 유틸리티 단일화
- `components.css` `.card-base` 블록 완전 삭제
- 인라인 `style={{ }}` 및 하드코딩 hex 색상 프로젝트 규칙 준수

---

### ✅ 구현 내용

#### Pages — card-base 교체 (9곳)

- **`src/pages/Stats.tsx`**: `card-base !p-0` → `bg-surface-card border border-border rounded-2xl p-0`, `card-base text-center py-12` → `bg-surface-card border border-border rounded-2xl text-center py-12`
- **`src/pages/Settings.tsx`**: `card-base p-0` → `bg-surface-card border border-border rounded-2xl p-0`
- **`src/pages/QuestionDetail.tsx`**: `card-base text-center py-8` → `bg-surface-card border border-border rounded-2xl text-center py-8`, `card-base shadow-sm ...` → Tailwind + `p-4 sm:p-6` 명시
- **`src/pages/AnswerFeedback.tsx`**: `card-base` 3곳 교체. main `#189` 커밋이 동일 파일 수정(시맨틱 클래스 `rationale-card`, `ans-card-wrong/correct` 도입) — 새 시맨틱 클래스 채택하고 card-base 교체분 반영
- **`src/pages/Home.tsx`**: 원래 1곳이었으나 main rebase 과정에서 추가된 카드 9곳 전체 교체

#### Components — card-base 교체 (7곳)

- **`src/components/SqlPlayground.tsx`**: `card-base mt-3` → `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mt-3`. 이후 main `#191` 커밋이 textarea를 `sql-playground-textarea` 시맨틱 클래스로 교체 — main 버전 채택
- **`src/components/StatsBarChart.tsx`**: `card-base` 교체
- **`src/components/StatsAnalysisCard.tsx`**: `card-base flex gap-3`, `card-base` 2곳 교체
- **`src/components/StatsTopicList.tsx`**: `card-base` 교체
- **`src/components/StatsRadarChart.tsx`**: `card-base` 교체
- **`src/components/ErrorFallback.tsx`**: main rebase 후 추가된 사용처 교체, 패딩 충돌(`p-4 sm:p-6` + `py-10 px-6`) → `py-10 px-6`만 유지

#### CSS 삭제

- **`src/styles/components.css`**: `.card-base { ... }` 기본 블록 + `@media (min-width: 640px) { .card-base { ... } }` 반응형 블록 완전 삭제

---

### 🔧 주요 변경사항 상세

#### 패딩 오버라이드 처리

기존에 `!p-0`, `p-0`, `py-8`, `py-12` 등으로 card-base의 기본 padding을 덮어쓰던 케이스는 기본값 `p-4 sm:p-6`을 제외하고 의도한 padding 클래스만 명시. Tailwind에서 같은 속성 클래스 충돌은 보장되지 않으므로 처음부터 명시적으로 작성.

#### 인라인 CSS 제거 (코드 리뷰 후 추가 수정)

코드 리뷰에서 인라인 `style={{ }}` 규칙 위반 확인 후 수정:

| 파일 | 기존 | 교체 |
|------|------|------|
| `SqlPlayground.tsx` textarea | `style={{ fontFamily, backgroundColor, border, minHeight, color }}` (정적 값 5개) | `font-mono bg-surface-code border border-border min-h-[120px] text-text-body` → 이후 main이 `sql-playground-textarea`로 재교체 |
| `Home.tsx` 진행 바 ×2 | `style={{ width: '...%' }}` | `[width:var(--bar-w)]` + CSS 변수 패턴 |
| `StatsTopicList.tsx` 진행 바 | `style={{ width: '...%' }}` | `[width:var(--bar-w)]` + CSS 변수 패턴 |
| `Stats.tsx` 진행 바 | `style={{ width: '...%' }}` | `[width:var(--bar-w)]` + CSS 변수 패턴 |
| `StatsBarChart.tsx` 동적 높이 | `style={{ height: Math.max(...) }}` | `[height:var(--chart-h)]` + CSS 변수 패턴 |

동적 값은 Tailwind arbitrary value만으로 표현 불가하여 CSS 변수 패턴(`style={{ "--bar-w": "..." }} + [width:var(--bar-w)]`) 적용. 팝오버 절대 좌표(`top`, `left`)는 `getBoundingClientRect` 기반 동적 계산이므로 현행 유지.

#### PR 머지 후 CodeRabbit 재지적 및 revert (커밋 `7c65169` → `4c6aedc`)

PR #197 머지 후 CodeRabbit이 진행 바의 CSS 변수 패턴(`style={{ "--bar-w": ... }}`)이 프로젝트 `인라인 style 금지` 규칙 위반이라고 재지적. `w-[${value}%]` Tailwind arbitrary value로 교체 시도(커밋 `7c65169`).

그러나 Tailwind v4의 `@tailwindcss/vite` 플러그인은 정적 스캔 방식이라 런타임 템플릿 문자열(`w-[${barWidth}%]`)을 감지하지 못하고, 프로덕션 빌드에서 해당 CSS 클래스가 누락되는 문제 확인. 즉시 원래 CSS 변수 패턴으로 복원(커밋 `4c6aedc`).

**결론**: CSS 변수 주입 패턴(`style={{ "--var": value }}` + `[prop:var(--var)]`)은 Tailwind에서 동적 값을 다루는 공식 권장 방식. `인라인 style 금지` 규칙의 예외 케이스로 간주.

#### 하드코딩 hex → 디자인 토큰 교체

`AnswerFeedback.tsx` 내 하드코딩된 hex 색상값을 디자인 토큰으로 교체:

- `bg-[#F3F4F6]` → `bg-surface-code`
- `border-[#E5E7EB]` → `border-border`
- `text-[#6B7280]` → `text-text-secondary`
- `text-[#111827]` → `text-text-primary`

#### main 브랜치 rebase 충돌 처리

작업 중 main에 AnswerFeedback.tsx 및 SqlPlayground.tsx 수정이 push되어 충돌 발생:

- **`#189` 충돌**: AnswerFeedback — `rationale-card`, `ans-card-wrong`, `ans-card-correct` 시맨틱 클래스 도입. components.css에 정의된 의도적 클래스이므로 main 버전 채택
- **`#191` 충돌**: SqlPlayground — textarea를 `sql-playground-textarea` 시맨틱 클래스로 교체. main 버전 채택

---

### 🧪 테스트 및 검증

- `npm run build` 빌드 성공 확인 (TypeScript 타입 에러 없음)
- `grep -rn "card-base" src/` 잔존 0건 확인
- `grep -n "card-base" src/styles/components.css` CSS 블록 삭제 확인

---

### 📌 참고사항

- `badge-topic` 클래스는 이슈 범위에 포함하지 않음 (passQL 전용 클래스로 유지)
- SchemaViewer, HeatmapCalendar 등 기존 파일의 인라인 style은 이번 이슈 범위 외 — 별도 이슈로 처리 필요
- `rationale-card`, `acc-sql-card`, `sql-playground-textarea` 등 main에서 새로 추가된 시맨틱 클래스는 components.css에 유지 (card-base 삭제 대상 아님)
- 팝오버 절대 좌표(`Stats.tsx`, `StatsTopicList.tsx`)는 `getBoundingClientRect` 기반으로 Tailwind 표현 불가 — 현행 유지
