# ❗[버그][선택지생성] AI_ONLY 정책에서 SQL 동치 유형 문제 MULTIPLE_CORRECT 반복 실패 #114

## 개요

`choiceSetPolicy=AI_ONLY` + `executionMode=EXECUTABLE` 조합의 "동일한 실행 결과를 내는 SQL은?" 유형 문제에서 AI가 의도적으로 틀린 선택지를 생성해도 샌드박스 검증 결과가 정답 SQL과 동일하게 나와 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 오류가 3회 재시도 내내 반복되는 구조적 버그를 수정했다. 두 가지 접근을 병행했다: 재시도 피드백 루프(동치 SQL 누적 전달)와 프롬프트 v3 업그레이드.

## 변경 사항

### 백엔드 — 선택지 생성 서비스

- `ChoiceSetGenerationService.java`: MULTIPLE_CORRECT 실패 시 동치임이 확인된 오답 SQL을 `equivalentSqls` 리스트에 누적하여 다음 AI 요청에 "[재시도 피드백]" 섹션으로 추가 — AI가 같은 SQL 동치 실수를 반복하지 않도록 명시적으로 금지
- `ChoiceSetResolver.java`: RESULT_MATCH 정책 분기 추가 — `generateResultMatch()` 호출 경로 분리 (기존 `generate()`와 독립)
- `ChoiceSetSaveService.java`: RESULT_MATCH 선택지 세트 성공 저장 메서드 `saveResultMatch()` 추가 — `kind=TEXT`, `is_correct`는 AI 판단이 아닌 JSON 비교 검증 결과 기반 덮어쓰기
- `SandboxValidator.java`: `validateResultMatch()` 메서드 추가 — Sandbox 재획득 없이 JSON 배열 파싱 → expected ExecuteResult와 행/열 비교 검증. `normalizeValue()`로 DB `Integer(1)` vs AI JSON `Double(1.0)` 숫자 타입 불일치 방지

### 백엔드 — DB 마이그레이션

- `V0_0_63__fix_ai_only_prompt_to_sql_equivalence.sql`:
  - `generate_choice_set` v2 비활성화 → v3 삽입 (AI_ONLY를 "기준 SQL과 동일 결과를 내는 SQL 찾기" 유형으로 명시, 선택지 body를 실행 결과 텍스트가 아닌 SQL 쿼리로 강제)
  - AI_ONLY EXECUTABLE 문제 stem 일괄 수정: "실행 결과로 올바른 것은?" → "동일한 실행 결과를 내는 SQL은?"
  - AI_ONLY EXECUTABLE 문제의 기존 선택지 세트 삭제 (재생성 유도) — submission FK 해제 → item → set 순 삭제

### 프론트엔드 — 새 컴포넌트

- `client/src/components/ResultMatchTable.tsx`: RESULT_MATCH 선택지 body(JSON 배열 문자열)를 파싱해 컴팩트 결과 테이블로 렌더링하는 신규 컴포넌트. JSON 파싱 실패 시 원문 텍스트 폴백. 빈 결과는 "(결과 없음)" 표시. 최대 높이 200px + 세로 스크롤

## 주요 구현 내용

**재시도 피드백 루프**: 1회차 검증에서 `matchesExpected=true`로 판정된 오답 SQL을 `collectEquivalentSqls()`로 수집하고 2·3회차 AI 요청의 user prompt 하단에 추가한다. "아래 SQL들은 기준 SQL과 동일한 결과를 내므로 오답으로 절대 사용하지 말 것"이라는 명시적 금지 목록이 AI의 동치 반복 실수를 억제한다.

**RESULT_MATCH 정책 추가**: 구조적으로 동치 문제가 반복 발생할 수 있는 `executionMode=EXECUTABLE` 문제에 대한 폴백 정책. answerSql을 Sandbox에서 1회 실행 후 그 결과 JSON을 AI 컨텍스트로 제공하고, AI가 생성한 선택지를 JSON 비교로 검증 — Sandbox 재획득 없이 처리.

**숫자 타입 정규화**: DB는 `Integer(1)`을 반환하지만 AI(Gemini)는 `1.0`으로 직렬화하는 경향이 있다. `BigDecimal.stripTrailingZeros().toPlainString()`으로 `1`과 `1.0`을 동일하게 취급하여 false negative를 방지.

## 주의사항

- 피드백 루프는 3회 재시도 한도 안에서만 동작하며 근본 해결이 아님 — 동치 문제 특성상 100% 해결이 어려울 경우 관리자 알림 또는 RESULT_MATCH 정책 수동 전환 검토 필요
- `V0_0_63` 마이그레이션은 기존 AI_ONLY EXECUTABLE 문제의 submission FK를 NULL 처리 후 choice_set 삭제 — 이력 손실 없이 재생성만 유도함
- RESULT_MATCH 선택지는 body가 JSON 배열 문자열이므로 SQL 실행 버튼 표시 불필요 — 프론트엔드 `ChoiceCard`의 `isExecutable` prop으로 제어
