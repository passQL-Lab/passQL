# 추천 문제 풀기 플로우 UI 통일 및 ChoiceReview 추가

**이슈**: [#112](https://github.com/passQL-Lab/passQL/issues/112)

---

### 📌 작업 개요

홈 화면의 추천 문제 경로(QuestionDetail → AnswerFeedback)가 PracticeSet · DailyChallenge 플로우와 UI 구조가 불일치하던 문제를 해결했다. 선택지 UI 리팩토링, EXECUTABLE 문제 제출 후 각 선택지 SQL을 직접 실행해 비교하는 오답노트 기능(ChoiceReview) 신규 추가, 채점 중 로딩 오버레이, 스키마 항상 표시 등을 포함한 전반적인 풀이 플로우 개선 작업이다.

---

### 🎯 구현 목표

- 선택지 UI를 라디오 버튼 → 카드 전체 클릭 방식으로 전환
- EXECUTABLE 문제에서 제출 후 각 선택지 SQL 실행 결과를 나란히 비교하는 오답노트 기능 추가
- 정답/오답 비교 블록에서 A/B/C/D 알파벳 뱃지 제거, correctKey 직접 노출 제거
- 문제 풀이 중 스키마를 항상 펼쳐 보여주고 드롭다운 토글 제거
- 채점 중 LoadingOverlay 표시로 제출 피드백 개선

---

### ✅ 구현 내용

#### ChoiceCard 전면 리팩토링
- **파일**: `src/components/ChoiceCard.tsx`
- **변경 내용**:
  - 라디오 버튼 제거, 카드 전체(wrapper)를 클릭해 선택하도록 전환
  - 선택 시 좌측 4px 인디고 보더, 미선택 시 `--color-border` 보더로 명확한 상태 표현
  - `<button>` wrapper → `<div role="button" tabIndex={0} aria-pressed={isSelected}>` 로 교체해 내부 버튼(실행, AI에게 물어보기) 중첩 HTML 위반 해소, `onKeyDown`으로 Enter/Space 키보드 접근성 유지
  - RESULT_MATCH 선택지 분기: `kind === "TEXT" && body가 JSON 배열`이면 `ResultMatchTable`로 렌더링, 실행 버튼 미표시
  - CONCEPT_ONLY 분기: 일반 텍스트로 렌더링
  - EXECUTABLE: 모노 폰트 SQL + 선택적 실행 버튼 + 결과 테이블

#### ChoiceReview 신규 컴포넌트
- **파일**: `src/components/ChoiceReview.tsx` (신규)
- **변경 내용**: 제출 후 오답노트 섹션으로 각 선택지 SQL을 직접 실행해 결과를 비교한다
  - `choices.filter(c => c.kind === "SQL")`로 RESULT_MATCH(TEXT kind) 선택지를 실행 대상에서 제외해 JSON body가 execute API로 전달되는 버그 방지
  - 실행 실패 시 에러 메시지와 재시도 버튼 표시 (기존: 조용히 로딩 해제, 사용자가 실패 인지 불가)
  - 선택한 선택지는 좌측 인디고 보더로 구분
  - SQL 종류 선택지가 없으면 컴포넌트 자체를 렌더링하지 않음

#### AnswerFeedback / PracticeSet / DailyChallenge — ChoiceReview 연동
- **파일**: `src/pages/AnswerFeedback.tsx`, `src/pages/PracticeSet.tsx`, `src/pages/DailyChallenge.tsx`
- **변경 내용**:
  - EXECUTABLE 문제 제출 시 선택지 목록을 함께 저장(`reviewChoices` 상태)
  - 피드백 표시 후 `ChoiceReview` 조건부 렌더링 (`choices[0]?.kind === "SQL"` 가드로 RESULT_MATCH 문제에서는 미렌더링)
  - `selectedKey`를 함께 전달해 사용자가 선택한 선택지를 오답노트에서 강조

#### QuestionDetail 개선
- **파일**: `src/pages/QuestionDetail.tsx`
- **변경 내용**:
  - 스키마 토글(드롭다운) 제거 → `SchemaViewer` 항상 렌더링
  - 선택지 클릭 시 자동 SQL 실행 제거 (제출 후 ChoiceReview에서 직접 실행)
  - 제출 payload에 `choices` 포함해 AnswerFeedback으로 전달
  - `submitMutation.isPending` 시 `LoadingOverlay` 표시 (이전: 하드코딩 300ms 지연)
  - 단일 스크롤 구조로 변경 (sticky/내부 스크롤 제거)

#### LoadingOverlay 개선
- **파일**: `src/components/LoadingOverlay.tsx`
- **변경 내용**:
  - `staticMessage` prop 추가: 전달 시 랜덤 메시지 회전 중단, 고정 텍스트 표시
  - `subMessage` prop 추가: 보조 설명 텍스트 커스터마이징
  - 채점 중에는 "채점 중..." 고정 메시지 + 스피너만 표시

#### PracticeFeedbackBar 개선
- **파일**: `src/components/PracticeFeedbackBar.tsx`
- **변경 내용**: 오답 헤더에서 `correctKey` 알파벳 직접 노출 제거, 정답/오답 아이콘+색상만으로 구분

---

### 🔧 주요 변경사항 상세

#### 중첩 버튼 HTML 위반 (버그 수정)
`ChoiceCard`가 `<button>` wrapper 안에 실행 버튼과 `ResultTable`의 "AI에게 물어보기" 버튼을 포함해 HTML spec 위반 상태였다. `<div role="button">` + `tabIndex={0}` + `onKeyDown(Enter/Space)` 조합으로 교체해 내부 버튼이 독립적인 대화형 요소로 인식된다.

#### RESULT_MATCH 선택지 execute API 호출 버그 (버그 수정)
RESULT_MATCH 정책 선택지는 `kind === "TEXT"`에 body가 JSON 배열 문자열이다. 기존 ChoiceReview는 모든 choices를 `executeChoice()` 대상으로 취급해 JSON body가 SQL로 API에 전달될 수 있었다. `choices.filter(c => c.kind === "SQL")` 필터로 해소하고, sqlChoices가 0개면 컴포넌트 자체를 미렌더링한다.

#### 실행 실패 무시 UX 버그 (버그 수정)
네트워크/5xx 실패 시 기존 catch 블록이 로딩 상태만 해제해 사용자는 버튼이 눌리지 않은 것처럼 경험했다. 선택지별 `errors` 상태를 추가해 에러 메시지와 재시도 버튼을 표시한다.

---

### 🧪 테스트 및 검증

- EXECUTABLE 문제에서 선택지 선택 → 제출 → ChoiceReview 각 선택지 실행 흐름 수동 확인
- RESULT_MATCH 문제에서 ChoiceReview 미렌더링 확인
- ChoiceCard 키보드(Tab + Enter/Space) 접근성 확인
- 채점 중 LoadingOverlay 표시 확인
- `npm run build` 정상 완료

---

### 📌 참고사항

- `choiceSetPolicy === "RESULT_MATCH"` 문제는 선택지 kind가 `TEXT`이고 body가 JSON 배열 — ChoiceReview와 ChoiceCard 모두 이 조합을 명시적으로 분기 처리
- PracticeSet / DailyChallenge의 `choices[0]?.kind === "SQL"` 가드와 AnswerFeedback의 `executionMode === "EXECUTABLE"` 조건이 각각 독립적으로 RESULT_MATCH 선택지 유입을 막고 있음
