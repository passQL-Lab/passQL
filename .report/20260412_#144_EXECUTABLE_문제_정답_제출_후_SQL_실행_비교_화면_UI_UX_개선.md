# EXECUTABLE 문제 정답 제출 후 SQL 실행 비교 화면 UI/UX 개선

**이슈**: [#144](https://github.com/passQL-Lab/passQL/issues/144)
**PR**: [#151](https://github.com/passQL-Lab/passQL/pull/151)

---

### 📌 작업 개요

`executionMode: "EXECUTABLE"` 문제 제출 후 결과 화면의 UI/UX 전면 개선.
기존에는 선택지별 SQL 실행 결과가 모두 자동 노출되어 화면이 지나치게 길어지고, 결과 테이블 스타일도 일관성이 없었음.
선택지 카드에 실행 버튼을 인라인 배치하는 방식으로 변경하고, 피드백 UI를 Duolingo 스타일로 리디자인.

---

### 🎯 구현 목표

- SQL 실행 결과를 즉시 전체 노출하지 않고 선택지 카드별 실행 버튼으로 선택적 확인
- ResultTable을 SchemaViewer와 동일한 스타일로 통일 (헤더 배경 + 행 구분선 + border)
- 정답/오답 선택지를 색상으로 시각적으로 구분
- 연습 모드 피드백바를 Duolingo 스타일로 리디자인 (하단 슬라이드업 패널)
- 제출 중 채점 오버레이로 화면 조작 차단

---

### ✅ 구현 내용

#### 1. AnswerFeedback.tsx — 결과 화면 전면 재설계
- **파일**: `src/pages/AnswerFeedback.tsx`
- **변경 내용**:
  - 선택지별 SQL 실행 결과를 카드 형태로 재구성 (`getChoiceCardStyle` 헬퍼 함수 추출)
  - 정답 카드(초록), 내가 선택한 오답(파란), 나머지(회색)로 시각적 구분
  - 제출 응답의 `selectedResult`/`correctResult`를 초기 캐시로 활용 — 정답·내 선택 카드는 즉시 결과 표시
  - 나머지 선택지는 실행 버튼 클릭 시 개별 실행
  - `executing: string | null` → `Set<string>` 변경으로 병렬 실행 시 로딩 상태 꼬임 방지
  - `executingKeyRef: useRef<Set<string>>` 동일 변경
- **이유**: 4개 선택지 결과를 모두 자동 노출하면 스크롤이 너무 길어져 학습 흐름을 방해함

#### 2. ResultTable.tsx — SchemaViewer 스타일 통일
- **파일**: `src/components/ResultTable.tsx`
- **변경 내용**:
  - 기존 초록 성공 카드(`success-card`) 래퍼 제거, 단독 테이블로 변경
  - `overflow-hidden rounded-xl border` 컨테이너 + 내부 `overflow-x-auto` 추가 (모바일 가로 스크롤 지원)
  - 행 수·소요 시간을 컴팩트 텍스트로 표시
- **이유**: SchemaViewer와 동일한 테이블 스타일로 UI 일관성 확보. 컬럼 수가 많을 때 가로 스크롤 가능하도록 개선

#### 3. PracticeFeedbackBar.tsx — Duolingo 스타일 리디자인
- **파일**: `src/components/PracticeFeedbackBar.tsx`
- **변경 내용**:
  - 하단 고정 슬라이드업 패널 (`animate-slide-up`, `rounded-t-2xl`)
  - 딤(dim) 오버레이 제거 — EXECUTABLE 모드에서 실행 버튼에 접근 가능하도록
  - 정답: 초록 배경 + "계속하기" 버튼, 오답: 빨간 배경 + "확인" 버튼
  - 스크롤 컨테이너에 `pb-52` 패딩 추가 — 마지막 선택지 카드가 피드백바에 가려지는 문제 해결
- **이유**: 실행 결과를 보면서 피드백도 확인해야 하므로 오버레이로 화면을 막으면 안 됨

#### 4. PracticeSet.tsx / DailyChallenge.tsx — 제출 중 채점 오버레이
- **파일**: `src/pages/PracticeSet.tsx`, `src/pages/DailyChallenge.tsx`
- **변경 내용**:
  - `submitting` 상태 추가 + 제출 API 호출 중 `LoadingOverlay` ("채점 중이에요") 표시
  - `practiceSubmitLabel="확인"` 고정 (기존에는 마지막 문제일 때 "결과보기"로 변경됐었음)
  - `PracticeFeedbackBar`에 `nextLabel={feedback?.isCorrect ? "계속하기" : "확인"}` 분기 추가
  - `PracticeSet.tsx`: `useBlocker(!shouldNavigateToResult && !exitConfirmed && !submitting)` — 채점 중 이탈 모달 충돌 방지
- **이유**: 채점 API 응답 전 다른 선택지를 클릭하거나 화면을 이탈하는 경우를 차단

#### 5. QuestionDetail.tsx — showExecution 프롭 연동
- **파일**: `src/pages/QuestionDetail.tsx`
- **변경 내용**:
  - `showExecution` 프롭 추가 — 제출 완료 후에만 ChoiceCard 안에 SQL 실행 버튼 표시
  - `cached={showExecution ? executeCache[choice.key] : undefined}` — 오답 후 다시 풀기 등 리뷰 모드 종료 시 이전 실행 결과 노출 방지
  - `onSelect={showExecution ? () => {} : handleSelect}` — 제출 후 선택 변경 방지
- **이유**: 풀이 중에는 실행 버튼이 없어야 하고, 재시도 시 이전 결과가 남으면 안 됨

#### 6. SchemaViewer.tsx — 기본 펼침 변경
- **파일**: `src/components/SchemaViewer.tsx`
- **변경 내용**: `useState(false)` → `useState(true)` — 스키마 섹션을 기본으로 펼침 상태로 변경
- **이유**: EXECUTABLE 문제에서는 스키마 확인이 필수적이므로 기본 펼침이 UX 상 유리

#### 7. components.css — data-table 스타일 개선
- **파일**: `src/styles/components.css`
- **변경 내용**: `data-table thead tr` 배경색 추가, `tbody tr` 행 구분선 추가, `th border-bottom` 중복 제거
- **이유**: SchemaViewer와 ResultTable 간 테이블 스타일 통일

---

### 🔧 주요 변경사항 상세

#### ChoiceReview 컴포넌트 제거
기존 결과 화면에서 선택지 비교에 사용하던 `ChoiceReview.tsx` 컴포넌트를 제거.
기능을 `AnswerFeedback.tsx`에 직접 통합하여 별도 컴포넌트 없이 선택지 카드 렌더링.
`PracticeSet`·`DailyChallenge`에서도 `ChoiceReview` 사용 제거 후 `QuestionDetail`의 `showExecution` 방식으로 전환.

#### 병렬 실행 안전성 개선 (CodeRabbit 리뷰 반영)
`executing: string | null` 단일 값으로는 두 카드를 빠르게 연속 클릭할 때 로딩 상태가 꼬이는 버그가 있었음.
`Set<string>` 방식으로 변경하여 각 카드의 로딩 상태를 독립적으로 관리.

**특이사항**:
- `DailyChallenge`에서 제출 버튼 클릭 시 이탈 모달이 오탐되는 버그가 발견되었으나 이번 PR 범위가 아니어서 별도 이슈로 문서화 (docs/issues/20260412_daily-challenge-submit-blocker-false-trigger.md)

---

### 🧪 테스트 및 검증

- EXECUTABLE 모드 문제에서 제출 후 선택지 카드 표시 확인
- 정답/내 선택/나머지 선택지 색상 구분 확인
- 실행 버튼 클릭 시 ResultTable 렌더링 및 가로 스크롤 동작 확인
- 연습 모드(PracticeSet) — 피드백바 슬라이드업, 채점 오버레이 표시 확인
- 데일리 챌린지(DailyChallenge) — 동일 동작 확인
- 오답 후 다시 풀기 시 이전 실행 결과 미노출 확인

---

### 📌 참고사항

- `wrap-break-word` 클래스는 Tailwind 기본 유틸리티가 아님 (CodeRabbit 지적). 현재 `AnswerFeedback.tsx:270`, `QuestionDetail.tsx:431`, `ChoiceCard.tsx:76`에서 사용 중이나 기존 코드 패턴과 동일하여 이번 PR에서는 유지. 별도 개선 검토 필요.
- `AnswerFeedback.tsx`는 동일 경로 재진입 시 이전 결과 캐시가 남는 edge case가 존재. `location.key` 기반 리셋이 이상적이나 실제 재현이 드물어 이번 PR 범위 외로 판단.
