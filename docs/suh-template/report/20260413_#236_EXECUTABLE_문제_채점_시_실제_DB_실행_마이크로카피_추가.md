# 🚀 [기능개선][로딩모달] EXECUTABLE 문제 채점 시 실제 DB 실행 마이크로카피 추가

## 개요

passQL의 핵심 기술 차별점인 **실제 Oracle DB에서 SQL을 직접 실행하여 정답을 판정하는 방식**이 기존에는 사용자에게 전혀 노출되지 않았다. EXECUTABLE 문제 채점 중 로딩 오버레이와 채점 완료 후 피드백 바에 이를 알리는 랜덤 마이크로카피를 추가하여, 단순 객관식과 차별되는 실행 기반 채점 경험을 사용자가 인지할 수 있도록 개선했다.

## 변경 사항

### 마이크로카피 상수 추가
- `client/src/constants/microcopy.ts`: `EXECUTABLE_GRADING_MESSAGES` 배열(5개 문구) 및 `getRandomExecutableGradingMessage()` 함수 추가

### 로딩 오버레이
- `client/src/components/LoadingOverlay.tsx`: `isExecutable` prop 추가. 채점 중(`staticMessage` 존재 시)에만 랜덤 문구를 표시하며, `useState` initializer 패턴으로 마운트 시 1회 고정하여 리렌더에 문구가 바뀌지 않도록 처리

### 채점 결과 피드백 바
- `client/src/components/PracticeFeedbackBar.tsx`: `result.correctResult != null` 조건으로 EXECUTABLE 문제를 판단, 해설 텍스트 하단에 랜덤 문구 표시. `useRef`로 마운트 시 1회 고정

### 호출부
- `client/src/pages/PracticeSet.tsx`: `displayQuestion?.executionMode === "EXECUTABLE"` 전달
- `client/src/pages/QuestionDetail.tsx`: `question.executionMode === "EXECUTABLE"` 전달

## 주요 구현 내용

**EXECUTABLE 판단 기준**

| 위치 | 판단 방식 |
|------|----------|
| `LoadingOverlay` | 부모에서 `executionMode === "EXECUTABLE"` 계산 후 `isExecutable` prop으로 주입 |
| `PracticeFeedbackBar` | `result.correctResult != null` — 백엔드가 EXECUTABLE일 때만 non-null 반환 |

**랜덤 문구 고정 전략**

두 컴포넌트 모두 마운트 시 1회만 문구를 선택하고 이후 리렌더에 바뀌지 않도록 처리했다.
- `LoadingOverlay`: `useState(getRandomExecutableGradingMessage)` — initializer 함수 형태로 전달
- `PracticeFeedbackBar`: `useRef(getRandomExecutableGradingMessage())` — ref에 고정

**노출 조건**

CONCEPT_ONLY 문제에는 두 위치 모두 문구가 표시되지 않으며, EXECUTABLE 문제에서만 노출된다. SQL 실행이 에러를 반환한 경우(`correctResult.errorCode != null`)에도 `correctResult` 자체는 non-null이므로 피드백 바 문구는 표시된다.

## 주의사항

- SQL 실행 실패(에러 코드 포함) 시에도 피드백 바의 마이크로카피가 노출됨 — 향후 `correctResult.errorCode == null` 조건 추가 여부 검토 필요
- `LoadingOverlay`의 `isExecutable` prop은 optional이므로 기존 호출부(문제 생성 로딩 등)에 영향 없음
