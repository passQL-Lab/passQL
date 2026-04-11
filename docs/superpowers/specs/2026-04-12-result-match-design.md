# RESULT_MATCH 정책 구현 설계 명세

**작성일**: 2026-04-12  
**관련 이슈**: [#023 RESULT_MATCH 정책 신규 구현](.issue/20260412_#023_RESULT_MATCH_정책_신규_구현_실행결과_텍스트_선택지_유형_추가.md)

---

## 1. 개요

"다음 SQL의 실행 결과로 올바른 것은?" 유형을 지원하는 `RESULT_MATCH` 선택지 정책을 추가한다.

기존 정책 비교:
- `AI_ONLY`: 선택지 = SQL 쿼리, 검증 = Sandbox 실행 결과 비교
- `ODD_ONE_OUT`: 선택지 = SQL 쿼리, 검증 = 4개 실행 결과 중 소수(1개) 판별
- `RESULT_MATCH` (신규): 선택지 = 실행 결과 JSON 테이블, 검증 = answerSql 결과와 JSON 직접 비교

---

## 2. 선택지 포맷

### body 구조

선택지 `body`는 JSON 배열 문자열로 저장된다.

```json
[{"NAME":"홍길동","DEPT_NAME":"개발팀"},{"NAME":"김영희","DEPT_NAME":"개발팀"}]
```

- 열 이름은 answerSql의 SELECT alias와 동일하게 대문자로 통일
- 행 순서는 의미 없음 (비교 시 정렬 후 비교)
- 빈 결과는 `[]` (빈 배열)

### kind 값

`ChoiceKind.TEXT` — 기존 CONCEPT_ONLY가 사용하는 값 그대로 재사용.  
DB 컬럼, Entity, 저장 로직 모두 수정 불필요.

---

## 3. 백엔드 아키텍처

### 3.1 ChoiceSetPolicy 열거형 추가

```java
// ChoiceSetPolicy.java
RESULT_MATCH  // "다음 SQL의 실행 결과로 올바른 것은?" — 결과 테이블 JSON 선택지
```

### 3.2 선택지 생성 플로우 (`ChoiceSetGenerationService`)

`RESULT_MATCH`는 기존 `generate()` → `generateResultMatch()`로 분기.

```
generateResultMatch() 플로우:
1. SandboxPool.acquire()
2. DDL + sampleData 적용
3. answerSql 실행 → expected ExecuteResult (이 결과를 재사용)
4. expected rows를 직렬화하여 AI에 전달 (정답 결과 1세트 + 오답 후보 생성 컨텍스트)
5. AI 호출: generate_choice_set_result_match 프롬프트
6. AI 응답: body = JSON 배열 형태의 4개 선택지
7. SandboxPool.release()
8. 검증: 각 body JSON 파싱 후 3단계에서 얻은 expected rows와 비교 (Sandbox 재호출 없음)
9. 성공 시 saveResultMatch() 호출
```

**핵심 설계 결정**: Sandbox를 선택지 생성 단계에서 1회만 사용(answerSql 실행용).  
검증은 이미 얻은 expected rows와 JSON 비교로 처리 — Sandbox 재획득 불필요.  
사용자의 실행 버튼 클릭 시 execute 엔드포인트를 호출하지 않음 (선택지 body가 SQL이 아님).

### 3.3 검증 로직 (`SandboxValidator`)

`RESULT_MATCH` 분기 추가:

```
validateResultMatch(choices, expectedResult) 플로우:
- expectedResult: generateResultMatch()에서 이미 실행한 answerSql의 ExecuteResult (전달받음)
- Sandbox 재획득 없음 — 순수 JSON 비교만 수행
1. 각 choice.body를 JSON 파싱 → List<Map<String, Object>>
2. expected rows와 parsed rows를 정렬 후 문자열 비교 (열 이름 대소문자 무시)
3. 일치하면 is_correct = true
4. JSON 파싱 실패 시 해당 선택지는 ERROR로 처리
```

**기존 `validate()` 시그니처와의 구분**: RESULT_MATCH는 Sandbox를 사용하지 않으므로  
`validateResultMatch(List<GeneratedChoiceDto>, ExecuteResult)`로 별도 메서드 작성.

비교 기준:
- 열 이름 대소문자 무시 비교
- 행 순서 무시 (정렬 후 비교)
- 값은 문자열로 변환 후 비교 (`toString()`)

### 3.4 저장 로직 (`ChoiceSetSaveService`)

`saveResultMatch()` 추가:

```java
// kind = TEXT, is_correct = 검증 결과 기반
kind(ChoiceKind.TEXT)
sandboxValidationPassed(true)
```

### 3.5 프롬프트 마이그레이션

`V0_0_64__add_result_match_prompt.sql`:

```
키: generate_choice_set_result_match
버전: 1
```

프롬프트 내용:
- system: "answerSql 실행 결과를 기준으로 정답 결과 JSON 1개 + 오답 결과 JSON 3개를 생성하라. body는 반드시 JSON 배열 형태여야 한다."
- user: stem, answerSql, 실행결과(rows), schemaDdl, schemaSampleData, difficulty를 컨텍스트로 제공

### 3.6 선택지 생성 진입점 (`QuestionChoiceGenerationFacade` 또는 기존 분기)

기존 `generateChoices` 엔드포인트의 분기:
```
executionMode == EXECUTABLE + policy == RESULT_MATCH → generateResultMatch()
executionMode == EXECUTABLE + policy == AI_ONLY/ODD_ONE_OUT → generate()
executionMode == CONCEPT_ONLY → generateConcept()
```

---

## 4. 프론트엔드 아키텍처

### 4.1 ChoiceCard 렌더링 분기

`kind === "TEXT"` + body가 JSON 배열이면 컴팩트 결과 테이블 렌더링.

```
판별 순서:
1. choice.kind === "TEXT" && body가 JSON 배열로 파싱 가능 → ResultMatchTable 렌더링
2. choice.kind === "TEXT" (파싱 불가) → 텍스트 렌더링 (기존 CONCEPT_ONLY 방식)
3. 나머지 → code-block + 실행 버튼 (기존 EXECUTABLE 방식)
```

**실행 버튼**: RESULT_MATCH 선택지에는 표시하지 않음 (body가 SQL이 아니므로).  
`isExecutable` prop은 `question.executionMode === "EXECUTABLE" && question.choiceSetPolicy !== "RESULT_MATCH"`로 결정.

### 4.2 ResultMatchTable 컴포넌트 (신규)

`client/src/components/ResultMatchTable.tsx`:

```
특성:
- compact 스타일 — 선택지 카드 내부에 맞는 크기
- 헤더: 열 이름 (SQL alias 기준)
- 행: 데이터 값 (JetBrains Mono 13px, 디자인 시스템 Data Table 스타일)
- 최대 높이: 200px, overflow-y: auto
- 빈 결과: "(결과 없음)" 텍스트 표시
```

디자인 시스템 준수:
- 기존 `ResultTable` 컴포넌트와 동일한 스타일 적용
- 실행 결과 상태(성공/실패) 표시 없음 — 순수 데이터 테이블

### 4.3 타입 변경 (`types/api.ts`)

`ChoiceItem`에 `kind` 필드 추가 (이미 백엔드가 내려주고 있을 경우 확인 필요):

```typescript
interface ChoiceItem {
  readonly key: string;
  readonly body: string;
  readonly kind?: "SQL" | "TEXT";
  // ... 기존 필드
}
```

### 4.4 QuestionDetail — isExecutable 판별 수정

```typescript
// 현재
isExecutable={question.executionMode === "EXECUTABLE"}

// 변경 후: RESULT_MATCH 선택지는 실행 버튼 제거
isExecutable={
  question.executionMode === "EXECUTABLE" &&
  question.choiceSetPolicy !== "RESULT_MATCH"
}
```

`QuestionDetail` 타입에 `choiceSetPolicy` 필드 추가 필요.

---

## 5. 데이터 흐름

```
문제 등록 (executionMode=EXECUTABLE, choiceSetPolicy=RESULT_MATCH)
    ↓
사용자 문제 상세 진입
    ↓
choiceSets 없음 → SSE generateChoices 호출
    ↓
generateResultMatch():
  1. Sandbox: answerSql 실행 → expected rows
  2. AI: expected rows + 스키마 → 4개 JSON 배열 선택지 생성
  3. 검증: 각 body JSON vs expected rows 비교
  4. kind=TEXT로 저장
    ↓
프론트 SSE complete → choices 수신
    ↓
ChoiceCard: kind===TEXT + JSON 배열 감지 → ResultMatchTable 렌더링
    ↓
사용자 선택 → submitAnswer
    ↓
백엔드 submit 검증: 선택한 choice의 is_correct 확인 (이미 저장됨)
```

---

## 6. 가이드라인 문서 업데이트

### `question-register-guide.md` / `question-bulk-guide.md`

`RESULT_MATCH` 정책 설명 추가:
- 문제 유형: "다음 SQL의 실행 결과로 올바른 것은?"
- 조건: `executionMode = EXECUTABLE`, `choiceSetPolicy = RESULT_MATCH`
- 필수 필드: `answerSql` (실행 결과 기준), `schemaDdl`, `schemaSampleData`
- 선택지 body: AI가 자동 생성 (관리자 직접 작성 불필요)

---

## 7. 에러 처리

| 에러 상황 | 처리 방식 |
|-----------|-----------|
| answerSql 실행 실패 | `SANDBOX_ANSWER_SQL_FAILED` throw, 재시도 불가 |
| AI가 JSON 배열 아닌 body 반환 | JSON 파싱 실패 → 해당 선택지 ERROR, 재시도 |
| correctCount != 1 | 기존과 동일: `CHOICE_SET_VALIDATION_NO_CORRECT/MULTIPLE_CORRECT`, 재시도 |
| 3회 모두 실패 | SSE error 이벤트 전송 (기존 동일) |

---

## 8. 영향 파일 목록

### 백엔드
| 파일 | 변경 내용 |
|------|-----------|
| `constant/ChoiceSetPolicy.java` | `RESULT_MATCH` 추가 |
| `service/ChoiceSetGenerationService.java` | `generateResultMatch()` 메서드 추가, 분기 로직 |
| `service/SandboxValidator.java` | `validateResultMatch()` 메서드 추가 |
| `service/ChoiceSetSaveService.java` | `saveResultMatch()` 메서드 추가 |
| `db/migration/V0_0_64__add_result_match_prompt.sql` | 프롬프트 시드 |

### 프론트엔드
| 파일 | 변경 내용 |
|------|-----------|
| `components/ChoiceCard.tsx` | kind===TEXT + JSON 배열 분기, ResultMatchTable 연결 |
| `components/ResultMatchTable.tsx` | 신규 컴포넌트 |
| `pages/QuestionDetail.tsx` | isExecutable 판별 수정, choiceSetPolicy 타입 추가 |
| `types/api.ts` | `ChoiceItem.kind` 필드, `QuestionDetail.choiceSetPolicy` 추가 |

### 문서
| 파일 | 변경 내용 |
|------|-----------|
| `static/docs/question-register-guide.md` | RESULT_MATCH 정책 설명 추가 |
| `static/docs/question-bulk-guide.md` | RESULT_MATCH 정책 설명 추가 |

---

## 9. 제외 범위 (Out of Scope)

- 기존 AI_ONLY/ODD_ONE_OUT/CONCEPT_ONLY 선택지 재생성 없음
- 관리자 화면 RESULT_MATCH 전용 UI 없음 (JSON body 직접 수정 불필요)
- RESULT_MATCH 문제에서 SQL Playground 표시 여부 — 현재 스코프 외 (기존 동작 유지)
