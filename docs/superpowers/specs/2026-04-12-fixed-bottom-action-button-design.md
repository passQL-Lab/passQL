# Fixed Bottom 액션 버튼 전 화면 통일 설계

## 배경

현재 `QuestionDetail`의 제출 버튼이 스크롤 영역 내부에 위치해, 제출 후 `PracticeFeedbackBar`(fixed bottom)와 동시에 화면에 존재하는 UI 불일치 문제가 있다. `AnswerFeedback`은 이미 fixed bottom 버튼을 쓰지만 스타일이 다른 화면과 통일되지 않았다.

## 목표

모든 화면에서 액션 버튼을 `fixed bottom-0 inset-x-0`으로 통일한다.

## 변경 범위

### 변경하는 파일

**`client/src/pages/QuestionDetail.tsx`**
- 제출 버튼 래퍼를 스크롤 영역 안에서 꺼내 `fixed bottom-0 inset-x-0 z-20`으로 이동
- 최상위 컨테이너 `pb-6` → `pb-24` (fixed 버튼 높이 확보)
- 버튼 컨테이너 스타일: `bg-surface-page border-t border-border`
- `max-w-120 mx-auto px-4 py-4` 내부 정렬 (DailyChallenge/PracticeSet max-width 동일)

**`client/src/pages/AnswerFeedback.tsx`**
- 기존 fixed 버튼의 z-index를 `z-20`으로 명시
- 버튼 컨테이너 배경/테두리 스타일을 `bg-surface-page border-t border-border`로 통일
- 스크롤 영역 하단 패딩 `pb-24` 확인 (이미 적용되어 있으면 유지)

### 변경하지 않는 파일

- `DailyChallenge.tsx` — `QuestionDetail` 수정으로 자동 해결
- `PracticeSet.tsx` — `QuestionDetail` 수정으로 자동 해결
- `PracticeFeedbackBar.tsx` — z-30 유지, 제출 버튼(z-20)을 자연스럽게 덮는 현재 구조 활용

## z-index 계층

| 레이어 | z-index | 대상 |
|---|---|---|
| 피드백바 | z-30 | PracticeFeedbackBar (제출 후 덮음) |
| 액션 버튼 | z-20 | QuestionDetail 제출 버튼, AnswerFeedback 하단 버튼 |
| 오버레이 | z-10 | LoadingOverlay 등 |

## 버튼 컨테이너 표준 구조

```tsx
<div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page border-t border-border">
  <div className="mx-auto max-w-120 px-4 py-4">
    {/* 버튼 */}
  </div>
</div>
```

## 동작 흐름

1. 풀이 중: 제출 버튼이 fixed bottom(z-20)에 고정
2. 제출 후 (DailyChallenge/PracticeSet): PracticeFeedbackBar(z-30)가 슬라이드업하며 제출 버튼을 덮음
3. 제출 후 (단독 QuestionDetail): 결과 페이지(`/questions/:uuid/result`)로 이동 → AnswerFeedback의 fixed 버튼으로 전환
4. AnswerFeedback: 동일한 fixed bottom(z-20) 구조로 일관성 유지

## 성공 기준

- DailyChallenge에서 제출 후 "제출하기" 버튼과 PracticeFeedbackBar가 동시에 보이지 않음
- 모든 화면에서 스크롤을 내리지 않아도 액션 버튼이 항상 보임
- QuestionDetail(단독), DailyChallenge, PracticeSet, AnswerFeedback 버튼 컨테이너 스타일 동일
