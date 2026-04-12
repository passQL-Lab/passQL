# card-base → Tailwind 유틸리티 교체 설계 문서

이슈: [#187](https://github.com/passQL-Lab/passQL/issues/187)

---

## 개요

`Questions.tsx` (#183) 교체 완료 후 코드베이스에 남아있는 `card-base` 커스텀 CSS 클래스 15곳을 순수 Tailwind 유틸리티로 교체한다. 교체 완료 후 `components.css`에서 `.card-base` 스타일 블록을 삭제한다.

---

## 교체 원칙

### 기본 치환

```
card-base
→ bg-surface-card border border-border rounded-2xl p-4 sm:p-6
```

`card-base` CSS가 제공하던 값과 1:1 대응:
- `background-color: var(--color-surface-card)` → `bg-surface-card`
- `border: 1px solid var(--color-border)` → `border border-border`
- `border-radius: 16px` → `rounded-2xl`
- `padding: 16px` / `@sm padding: 24px` → `p-4 sm:p-6`
- `transition: ...` → 인터랙티브 카드에만 별도 명시 (`transition-all duration-200`). 정적 카드는 생략.

### 패딩 오버라이드 처리

기존에 `!p-0`, `p-0`, `py-8`, `py-12` 등으로 padding을 덮어쓰던 케이스는 **기본값 `p-4 sm:p-6`을 제외**하고 해당 padding 클래스만 명시한다. Tailwind에서 같은 속성 클래스 충돌은 보장되지 않으므로 처음부터 명시적으로 작성한다.

---

## 작업 범위 및 교체 매핑

### Commit 1 — Pages (5개 파일, 9곳)

| 파일 | 기존 | 교체 후 |
|------|------|---------|
| `Stats.tsx:157` | `card-base !p-0` | `bg-surface-card border border-border rounded-2xl p-0` |
| `Stats.tsx:234` | `card-base text-center py-12` | `bg-surface-card border border-border rounded-2xl text-center py-12` |
| `Settings.tsx:48` | `card-base p-0` | `bg-surface-card border border-border rounded-2xl p-0` |
| `QuestionDetail.tsx:322` | `mt-4 card-base text-center py-8 space-y-2` | `mt-4 bg-surface-card border border-border rounded-2xl text-center py-8 space-y-2` |
| `QuestionDetail.tsx:424` | `card-base shadow-sm w-full text-left flex items-start gap-2 mt-2` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm w-full text-left flex items-start gap-2 mt-2` |
| `AnswerFeedback.tsx:185` | `card-base` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` |
| `AnswerFeedback.tsx:217` | `card-base mt-4` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mt-4` |
| `AnswerFeedback.tsx:312` | `card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors` |
| `Home.tsx:347` | `card-base shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200` |

### Commit 2 — Components + CSS 삭제 (5개 컴포넌트, 6곳 + CSS)

| 파일 | 기존 | 교체 후 |
|------|------|---------|
| `SqlPlayground.tsx:31` | `card-base mt-3` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mt-3` |
| `StatsBarChart.tsx:31` | `card-base` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` |
| `StatsAnalysisCard.tsx:14` | `card-base flex gap-3` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex gap-3` |
| `StatsAnalysisCard.tsx:28` | `card-base` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` |
| `StatsTopicList.tsx:106` | `card-base` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` |
| `StatsRadarChart.tsx:21` | `card-base` | `bg-surface-card border border-border rounded-2xl p-4 sm:p-6` |
| `components.css` | `.card-base { … }` + `@media { .card-base { … } }` | **삭제** |

---

## 커밋 전략

**Approach B: Pages / Components 2단계 커밋**

```
Commit 1: refactor: card-base → Tailwind 유틸리티 교체 (pages) #187
Commit 2: refactor: card-base → Tailwind 유틸리티 교체 (components) + CSS 삭제 #187
```

- Pages 먼저, Components 나중
- CSS 삭제는 모든 사용처 제거가 확인된 Commit 2에 포함

---

## 제약 사항

- 인라인 `style={{ }}` 속성 사용 금지 — Tailwind 유틸리티만 사용
- `badge-topic`은 이슈 범위에 포함하지 않음 (passQL 전용 클래스로 유지)
- 시각적 결과는 기존과 동일해야 함 (기능 변경 없는 순수 리팩토링)
