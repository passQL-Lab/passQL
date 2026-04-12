# EXECUTABLE 문제 정답 제출 후 결과 화면 UI/UX 개선

**이슈**: #144  
**브랜치**: `20260412_#144_EXECUTABLE_문제_정답_제출_후_SQL_실행_비교_화면_UI_UX_개선`  
**날짜**: 2026-04-12

---

## 문제 정의

`executionMode: "EXECUTABLE"` 문제에서 정답 제출 후 `AnswerFeedback` 화면이 두 가지 이유로 UX가 불편함:

1. **중복 구조**: `comparisonSection`(정답+내 선택 SQL 즉시 표시) + `ChoiceReview`(4개 선택지 재나열)가 같은 내용을 두 번 보여줌
2. **긴 스크롤**: 4개 선택지가 모두 즉시 렌더링되어 화면이 지나치게 길어짐
3. **ResultTable 스타일 일관성 부재**: `data-table` 클래스는 행 구분선이 없어 `SchemaViewer`의 테이블 스타일과 다름

---

## 설계 방향

### 핵심 원칙

- `comparisonSection` + `ChoiceReview` 두 영역을 **선택지 카드 4개 목록 하나로 통합**
- 제출 시 BE에서 받은 `selectedResult` / `correctResult`를 해당 카드의 **초기 실행 결과 캐시**로 활용 → API 재호출 없음
- `ResultTable` 스타일을 `SchemaViewer`와 동일하게 통일

---

## 변경 후 AnswerFeedback 화면 구조

```
┌─────────────────────────────────┐
│  정답/오답 헤더 (아이콘 + 문구)    │  ← 현재와 동일
├─────────────────────────────────┤
│  해설 카드                        │  ← rationale 텍스트 단독 카드
│  + 오답 시 "AI에게 물어보기" 버튼  │
├─────────────────────────────────┤
│  선택지 카드 목록 (4개)            │
│  ┌─────────────────────────────┐ │
│  │ [A] SQL 본문                │ │  ← 정답: 초록 강조
│  │     실행 결과 (즉시 표시)    │ │    selectedResult 캐시 사용
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ [B] SQL 본문                │ │  ← 내가 선택 (오답): 파란 강조
│  │     실행 결과 (즉시 표시)    │ │    correctResult 캐시 사용
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ [C] SQL 본문                │ │  ← 나머지: 기본 회색
│  │              [실행] 버튼    │ │    수동 실행 (기존 방식)
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ [D] SQL 본문                │ │
│  │              [실행] 버튼    │ │
│  └─────────────────────────────┘ │
├─────────────────────────────────┤
│  유사 문제                        │  ← 현재와 동일
└─────────────────────────────────┘
```

---

## 선택지 카드 스타일 규칙

| 상태 | 왼쪽 보더 색 | 배경색 | 레이블 |
|------|-------------|--------|--------|
| 정답 (`isCorrect`) | `--color-sem-success` | `--color-sem-success-light` | "정답" 뱃지 |
| 내가 선택 + 오답 | `--color-brand` | `--color-brand-light` | "내 선택" 뱃지 |
| 내가 선택 + 정답 | `--color-sem-success` | `--color-sem-success-light` | "정답 · 내 선택" 뱃지 |
| 나머지 | `--color-border` | `--color-surface-card` | 없음 |

카드 상단에 선택지 키(A/B/C/D)와 상태 뱃지를 나란히 표시.

---

## ResultTable 스타일 통일

현재 `data-table` CSS 클래스에 행 구분선 추가:

```css
.data-table tr {
  border-bottom: 1px solid var(--color-border);
}
.data-table tr:last-child {
  border-bottom: none;
}
```

테이블 컨테이너에 외곽 border + rounded 추가 (`SchemaViewer`의 `overflow-hidden rounded-xl border` 패턴 동일 적용).

---

## 데이터 흐름

### 제출 후 AnswerFeedback 진입 시

```
navigate('/answer-feedback', {
  state: {
    ...기존 필드,
    choices,          // ChoiceItem[] — 전체 선택지
    selectedResult,   // ExecuteResult | null — BE 제출 응답에서
    correctResult,    // ExecuteResult | null — BE 제출 응답에서
    selectedKey,
    correctKey,       // ← 신규 추가 필요
  }
})
```

`FeedbackState`에 `correctKey: string` 필드 추가 필요 (현재 없음 — 정답 카드 판별용).

### 카드별 초기 캐시 구성

`AnswerFeedback` 마운트 시 `useRef` 또는 `useState` 초기값으로 캐시 구성:

```ts
const initialCache: Record<string, ExecuteResult> = {};
if (selectedResult && selectedKey) initialCache[selectedKey] = selectedResult;
if (correctResult && correctKey) initialCache[correctKey] = correctResult;
```

나머지 카드는 캐시 없음 → 실행 버튼으로 수동 실행.

---

## 컴포넌트 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/AnswerFeedback.tsx` | `comparisonSection` 제거, `ChoiceReview` 대신 새 선택지 카드 목록 렌더링. `FeedbackState`에 `correctKey` 추가 |
| `src/components/ChoiceReview.tsx` | 제거 (또는 미사용) |
| `src/components/ResultTable.tsx` | 테이블 컨테이너에 border + rounded 추가, 행 구분선 추가 |
| `src/styles/components.css` | `.data-table` 행 구분선 스타일 추가 |
| `src/pages/QuestionDetail.tsx` | `navigate` 시 `correctKey` 전달 추가 |

---

## 비변경 범위

- `ChoiceCard.tsx` — 풀이 중 화면은 변경 없음
- `AiExplanationSheet.tsx` — 변경 없음
- 유사 문제 섹션 — 변경 없음
- `CONCEPT_ONLY` 문제 AnswerFeedback — EXECUTABLE 분기 외 변경 없음
