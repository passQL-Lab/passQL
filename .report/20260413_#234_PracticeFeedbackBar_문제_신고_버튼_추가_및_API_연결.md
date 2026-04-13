# ⚙️[기능추가][문제신고] PracticeFeedbackBar에 문제 신고 버튼 추가 및 API 연결 필요

## 개요

문제 풀이 직후 정답/오답 피드백 바(`PracticeFeedbackBar`)에서 즉시 신고할 수 없던 문제를 해결했다. 헤더 우측에 `Flag` 신고 아이콘 버튼을 추가하고, 기존 `ReportModal` 컴포넌트를 재사용하여 `PracticeSet` 페이지에서 신고 흐름 전체를 연결했다.

## 변경 사항

### 컴포넌트

- `client/src/components/PracticeFeedbackBar.tsx`: `onReport`, `isReported` props 추가. 헤더 우측에 `Flag` 아이콘 신고 버튼 배치. `submissionUuid`가 없으면(=`onReport` 미전달) 버튼 미표시. 이미 신고한 경우 `opacity-40 cursor-not-allowed disabled` 처리. `guard()` 패턴 적용으로 이중 클릭 방지.

### 페이지

- `client/src/pages/PracticeSet.tsx`: 신고 관련 상태 추가(`feedbackChoiceSetUuid`, `reportModalOpen`, `reportedSubmissions`, `showReportToast`, `toastTimerIdRef`). 답안 제출 시 `choiceSetId`를 `feedbackChoiceSetUuid`로 별도 보관. `handleNext`에서 신고 모달/choiceSetUuid 초기화. `ReportModal` 연결 — `submissionUuid`를 지역 변수로 추출하여 non-null assertion 없이 타입 안전하게 렌더. 토스트 타이머를 `toastTimerIdRef`로 관리하여 언마운트 시 클린업.
- `client/src/pages/PracticeResult.tsx`: 신고 완료 토스트 문구 통일.

## 주요 구현 내용

**신고 버튼 표시 조건**: `feedback.submissionUuid`와 `memberUuid`가 모두 있을 때만 `onReport`를 전달한다. 제출 API 실패 시 `submissionUuid`가 없으므로 버튼이 자동으로 숨겨진다.

**`feedbackChoiceSetUuid` 별도 관리**: `SubmitResult` 타입에 `choiceSetUuid`가 없어 제출 시점의 `choiceSetId`를 별도 state로 보관하고, `handleNext` 시 `undefined`로 초기화한다.

**non-null assertion 제거**: `ReportModal` 렌더 블록을 즉시 실행 함수(IIFE)로 감싸 `submissionUuid`를 지역 변수로 추출했다. `!` 없이 클로저에서 타입 좁힘이 유지된다.

**토스트 타이머 클린업**: `toastTimerIdRef`에 타이머 ID를 저장하고 `useEffect` 클린업에서 `clearTimeout`하여 언마운트 후 setState 호출을 방지한다.

**신고 완료 토스트 문구**: `"신고를 접수했어요."` — 서비스가 받았다는 의미가 명확하고 비격식 해요체로 친근하게 표현.

## 주의사항

- `isReported` prop 타입은 `Boolean` 래퍼(프로젝트 CLAUDE.md 규칙). JSX 내 조건 평가 시 `Boolean(isReported)`로 래핑하여 사용.
- `PracticeResult`의 신고 토스트 문구도 동일하게 `"신고를 접수했어요."`로 통일됨.
