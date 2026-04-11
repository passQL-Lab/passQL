# 데일리 챌린지 페이지 설계

**날짜:** 2026-04-11  
**이슈:** #101  
**범위:** 홈 완료 UI 개선 + `/daily-challenge` 전용 라우트 도입

---

## 배경

홈 화면에서 오늘의 문제를 완료하면 `"오늘의 문제 (완료)"` 텍스트만 표시되어 UX가 좋지 않다. 또한 오늘의 문제 클릭 시 일반 문제 페이지(`/questions/{uuid}`)로 이동해 "다음 문제" 버튼이 노출되는 등 일반 문제와 UI 흐름이 혼재된다.

---

## 목표

1. 홈 카드: 완료 시 클릭 불가 + 명확한 완료 상태 UI
2. 오늘의 문제 전용 라우트(`/daily-challenge`) 도입
3. 결과 화면 버튼: 정답 → "홈으로 가기", 오답 → "다시 풀기"
4. 기존 `QuestionDetail`, `AnswerFeedback` 컴포넌트 최대한 재사용

---

## 변경 범위

### 1. `DailyChallenge.tsx` (신규)

- **위치:** `src/pages/DailyChallenge.tsx`
- **라우트:** `/daily-challenge` (AppLayout 내부)
- **데이터:** `useTodayQuestion()` 훅으로 오늘의 문제 로딩
- **로직:**
  - `alreadySolvedToday=true` → `<Navigate to="/" replace />` 로 홈 리다이렉트
  - `question=null` (오늘 문제 없음) → "오늘의 문제가 없어요" 안내 + 홈 버튼
  - 정상: `<QuestionDetail>` 렌더링 (questionUuid prop + onSubmitSuccess 콜백)
- **submit 콜백:**
  ```
  onSubmitSuccess(result, questionUuid) →
    navigate(`/questions/${questionUuid}/result`, {
      state: { ...result, isDailyChallenge: true }
    })
  ```

### 2. `QuestionDetail.tsx` (최소 수정)

- `onSubmitSuccess?: (result: SubmitResult, questionUuid: string) => void` prop 추가
- `handleSubmit` 내부: prop이 있으면 `onSubmitSuccess(result, questionUuid)` 호출, 없으면 기존 navigate 유지
- 기존 practiceMode 로직과 독립적으로 동작

### 3. `AnswerFeedback.tsx` (하단 버튼 분기)

- `FeedbackState`에 `isDailyChallenge?: boolean` 필드 추가
- 하단 버튼 동작:

| 조건 | 버튼 텍스트 | navigate |
|------|------------|----------|
| 일반 문제 (기본) | 다음 문제 | `/questions` |
| 데일리 + 정답 | 홈으로 가기 | `/` |
| 데일리 + 오답 | 다시 풀기 | `/daily-challenge` (replace: true) |

- 버튼 색상은 기존 정답/오답 시맨틱 색상 유지

### 4. `Home.tsx` (홈 카드 완료 UI)

- `alreadySolvedToday=false`: `<Link to="/daily-challenge">` 유지
- `alreadySolvedToday=true`:
  - Link 제거 → `<div>` (클릭 불가)
  - 라벨: "오늘의 문제" (텍스트 "(완료)" 제거)
  - 우상단 체크 아이콘 (`Check` from lucide-react, `text-green-500`)
  - 카드 배경: `bg-code` (디자인 시스템 Level 1b 배경색으로 완료 상태 표현)
  - `cursor-default` (호버 효과 제거)

### 5. `App.tsx` (라우트 추가)

```
{ path: "daily-challenge", element: <DailyChallenge /> }
```
AppLayout children 안에 추가.

---

## 데이터 흐름

```
홈 카드 (alreadySolvedToday=false)
  └─ Link to="/daily-challenge"
       └─ DailyChallenge.tsx
            └─ useTodayQuestion() → question
            └─ QuestionDetail (questionUuid, onSubmitSuccess)
                 └─ 제출 성공
                      └─ navigate("/questions/{uuid}/result", { state: { ...result, isDailyChallenge: true }})
                           └─ AnswerFeedback.tsx
                                └─ 정답: [홈으로 가기] → navigate("/")
                                └─ 오답: [다시 풀기] → navigate("/daily-challenge", { replace: true })

홈 카드 (alreadySolvedToday=true)
  └─ 클릭 불가, 체크 아이콘 + 흐림 처리
```

---

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| `/daily-challenge` 접근 시 `alreadySolvedToday=true` | 홈으로 redirect |
| 오늘의 문제 없음 (`question=null`) | "오늘의 문제가 없어요" + 홈 버튼 |
| `useTodayQuestion` 로딩 중 | QuestionDetail 기존 skeleton UI 재사용 |
| API 에러 | ErrorFallback 컴포넌트 |

---

## 재사용 컴포넌트

변경 없이 그대로 사용:
- `QuestionDetail` (prop 추가만)
- `AnswerFeedback` (state 필드 추가만)
- `AiExplanationSheet`, `ChoiceCard`, `SqlPlayground` 등 내부 컴포넌트 전부
