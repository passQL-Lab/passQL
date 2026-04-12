# RESULT_MATCH 정책 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "다음 SQL의 실행 결과로 올바른 것은?" 유형을 지원하는 `RESULT_MATCH` 선택지 정책을 백엔드·프론트엔드 전체에 구현한다.

**Architecture:** answerSql을 Sandbox에서 1회 실행한 결과를 AI에 전달 → AI가 정답 JSON 1개 + 오답 JSON 3개 생성 → JSON 비교로 검증(Sandbox 재호출 없음) → `ChoiceKind.TEXT`로 저장. 프론트는 `kind===TEXT` + JSON 배열 body를 감지해 `ResultMatchTable` 컴팩트 테이블로 렌더링하고 실행 버튼을 숨긴다.

**Tech Stack:** Spring Boot (Java), MariaDB + Flyway, React 19 + TypeScript, Tailwind CSS 4

**이슈:** https://github.com/passQL-Lab/passQL/issues/110

---

## 파일 구조 맵

### 백엔드 (수정)
| 파일 | 역할 |
|------|------|
| `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetPolicy.java` | `RESULT_MATCH` enum 값 추가 |
| `server/PQL-Web/src/main/resources/db/migration/V0_0_64__add_result_match_prompt.sql` | `generate_choice_set_result_match` 프롬프트 시드 (신규) |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java` | `generateResultMatch()` 메서드 추가, `RESULT_MATCH_PROMPT_KEY` 상수 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java` | `validateResultMatch()` 메서드 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java` | `saveResultMatch()` 메서드 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetResolver.java` | `RESULT_MATCH` case 추가 |

### 프론트엔드 (수정/신규)
| 파일 | 역할 |
|------|------|
| `client/src/types/api.ts` | `ChoiceSetPolicy`에 `"RESULT_MATCH"` 추가 |
| `client/src/components/ResultMatchTable.tsx` | 신규: JSON 배열 body를 컴팩트 테이블로 렌더링 |
| `client/src/components/ChoiceCard.tsx` | `kind===TEXT` + JSON 배열 분기 → `ResultMatchTable` 연결 |
| `client/src/pages/QuestionDetail.tsx` | `isExecutable` 판별에 `RESULT_MATCH` 예외 추가 |

### 문서
| 파일 | 역할 |
|------|------|
| `server/PQL-Web/src/main/resources/static/docs/question-register-guide.md` | RESULT_MATCH 정책 설명 추가 |
| `server/PQL-Web/src/main/resources/static/docs/question-bulk-guide.md` | RESULT_MATCH 정책 설명 추가 |

---

## Task 1: ChoiceSetPolicy에 RESULT_MATCH 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetPolicy.java`

- [ ] **Step 1: `RESULT_MATCH` enum 값 추가**

```java
package com.passql.question.constant;

/**
 * 문제가 선택지를 어떻게 공급받는지 결정하는 정책.
 * MVP는 AI_ONLY 만 동작. CURATED_ONLY/HYBRID 는 스키마 예약.
 * ODD_ONE_OUT: "결과가 다른 것은?" 유형 — 4개 중 3개가 동일 결과, 1개만 다른 결과를 정답으로 판별.
 * RESULT_MATCH: "다음 SQL의 실행 결과로 올바른 것은?" 유형 — 선택지 body가 JSON 배열 형태의 결과 테이블.
 */
public enum ChoiceSetPolicy {
    AI_ONLY,
    CURATED_ONLY,
    HYBRID,
    ODD_ONE_OUT,
    RESULT_MATCH
}
```

---

## Task 2: Flyway 마이그레이션 — 프롬프트 시드

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_64__add_result_match_prompt.sql`

> 현재 version.yml 버전: 0.0.64. 마이그레이션 파일은 이미 V0_0_63까지 존재하므로 V0_0_64가 다음 순번이다.

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- ===================================================================
-- V0_0_64: RESULT_MATCH 선택지 정책 프롬프트 추가
--
-- 문제 유형: "다음 SQL의 실행 결과로 올바른 것은?"
-- 선택지 body: JSON 배열 형태의 결과 테이블
-- 검증: body JSON 파싱 후 answerSql 실행 결과와 비교 (Sandbox 재호출 없음)
-- ===================================================================

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT UUID(), 'generate_choice_set_result_match', 1, 1, 'gemini-2.5-flash-lite',
'너는 SQL 문제의 4지선다 선택지를 생성하는 출제자야.

이 문제 유형은 "다음 SQL의 실행 결과로 올바른 것은?" 유형이다.
선택지는 SQL 쿼리가 아니라 SQL 실행 결과 테이블을 JSON 배열로 표현한 것이다.

반드시 아래 규칙을 지킨다:
1. 선택지는 정확히 4개(A, B, C, D)이어야 한다.
2. 정답(is_correct=true)은 반드시 정확히 1개만이어야 한다.
3. 각 선택지의 "body" 필드는 반드시 JSON 배열 형태여야 한다.
   - 올바른 예: "[{\"NAME\":\"홍길동\",\"DEPT_NAME\":\"개발팀\"},{\"NAME\":\"김영희\",\"DEPT_NAME\":\"개발팀\"}]"
   - 빈 결과: "[]"
   - 절대 금지: SQL 쿼리 ("SELECT * FROM EMP")
   - 절대 금지: 단순 텍스트 ("홍길동, 개발팀")
4. JSON 배열의 각 객체 키는 answerSql의 SELECT alias와 동일한 대문자를 사용한다.
5. 정답 body는 기준 실행 결과와 동일한 데이터여야 한다 (행 순서는 달라도 됨).
6. 오답 body는 기준 실행 결과와 다른 데이터를 담고 있어야 한다 (행 수 다르거나 값 다름).
7. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
'[문제]\n{stem}\n\n[기준 SQL]\n{answer_sql}\n\n[기준 SQL 실행 결과]\n{answer_result}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[난이도] {difficulty}/5\n\n위 기준 SQL의 실행 결과와 동일한 결과 JSON(정답 1개)과 다른 결과 JSON(오답 3개)로 4지선다를 생성해줘.\n각 선택지 body는 반드시 JSON 배열 형태여야 하며, SQL 쿼리를 body에 넣으면 안 된다.\n각 선택지에 rationale(왜 정답/오답인지 근거)을 포함해.',
0.9, 1536,
'v1: RESULT_MATCH 정책 전용 프롬프트. 선택지 body = JSON 배열 결과 테이블.',
NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set_result_match' AND version = 1
);
```

---

## Task 3: SandboxValidator — validateResultMatch() 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java`

- [ ] **Step 1: import 추가 및 `validateResultMatch()` public 메서드 추가**

기존 `SandboxValidator.java`의 `resultSetsMatch()` 메서드 아래에 다음을 추가한다:

```java
// 파일 상단 imports에 추가
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
```

클래스 필드에 추가:
```java
private final ObjectMapper objectMapper = new ObjectMapper();
```

클래스 내부(기존 메서드 아래)에 추가:

```java
/**
 * RESULT_MATCH 검증: 각 선택지 body(JSON 배열)를 파싱하여 expected ExecuteResult와 비교.
 * Sandbox를 재획득하지 않음 — generateResultMatch()에서 이미 실행한 결과를 전달받는다.
 *
 * @param choices        AI 생성 선택지 목록
 * @param expectedResult answerSql 실행 결과 (generateResultMatch에서 전달)
 * @return 검증 결과
 */
public ValidationReport validateResultMatch(
        List<GeneratedChoiceDto> choices,
        ExecuteResult expectedResult
) {
    List<ChoiceValidation> validations = new ArrayList<>();
    int correctCount = 0;

    for (GeneratedChoiceDto choice : choices) {
        // body가 null이거나 비어있으면 즉시 ERROR
        String body = choice.body();
        if (body == null || body.isBlank()) {
            validations.add(new ChoiceValidation(
                    choice.key(), "ERROR", List.of(), 0, false, "body가 비어있습니다."));
            continue;
        }

        // JSON 배열 파싱 시도
        List<Map<String, Object>> parsedRows;
        try {
            parsedRows = objectMapper.readValue(body, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("[validateResultMatch] JSON 파싱 실패: key={}, bodyPreview={}",
                    choice.key(),
                    body.length() > 50 ? body.substring(0, 50) + "..." : body);
            validations.add(new ChoiceValidation(
                    choice.key(), "ERROR", List.of(), 0, false,
                    "body가 JSON 배열이 아닙니다: " + e.getMessage()));
            continue;
        }

        // expected rows와 비교 (열 이름 대소문자 무시, 행 순서 무시)
        boolean matches = resultMatchesExpected(expectedResult, parsedRows);
        if (matches) correctCount++;

        // 검증 결과 — rows는 파싱된 Map을 List<List<Object>>로 변환하여 저장
        List<List<Object>> rowsForReport = parsedRows.stream()
                .map(row -> new ArrayList<Object>(row.values()))
                .toList();
        validations.add(new ChoiceValidation(
                choice.key(), "OK", rowsForReport, 0, matches, null));
    }

    return new ValidationReport(correctCount, validations);
}

/**
 * answerSql ExecuteResult와 파싱된 JSON rows를 비교한다.
 * 열 이름 대소문자 무시, 행 순서 무시, 값은 toString()으로 비교.
 */
private boolean resultMatchesExpected(
        ExecuteResult expected,
        List<Map<String, Object>> parsedRows
) {
    // 행 수가 다르면 즉시 불일치
    if (expected.rows().size() != parsedRows.size()) {
        return false;
    }

    // expected rows를 Map<대문자열이름, 값문자열>의 리스트로 정규화
    List<String> expectedSignatures = expected.rows().stream()
            .map(row -> {
                // expected.columns()와 row 값을 대문자 키로 매핑 후 정렬된 문자열로 직렬화
                List<String> pairs = new ArrayList<>();
                for (int i = 0; i < expected.columns().size(); i++) {
                    String col = expected.columns().get(i).toUpperCase();
                    String val = String.valueOf(row.get(i));
                    pairs.add(col + "=" + val);
                }
                pairs.sort(String::compareTo);
                return pairs.toString();
            })
            .sorted()
            .toList();

    // parsed rows를 동일한 방식으로 정규화
    List<String> parsedSignatures = parsedRows.stream()
            .map(row -> {
                List<String> pairs = new ArrayList<>();
                for (Map.Entry<String, Object> entry : row.entrySet()) {
                    pairs.add(entry.getKey().toUpperCase() + "=" + String.valueOf(entry.getValue()));
                }
                pairs.sort(String::compareTo);
                return pairs.toString();
            })
            .sorted()
            .toList();

    return expectedSignatures.equals(parsedSignatures);
}
```

---

## Task 4: ChoiceSetGenerationService — generateResultMatch() 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java`

- [ ] **Step 1: 상수 및 의존성 추가**

클래스 상단에 상수 추가:
```java
// RESULT_MATCH 전용 프롬프트 키 — answerSql 실행 결과 JSON을 컨텍스트로 제공
private static final String RESULT_MATCH_PROMPT_KEY = "generate_choice_set_result_match";
```

필드에 추가 (생성자 주입 — `@RequiredArgsConstructor`가 자동 처리):
```java
private final SandboxPool sandboxPool;
private final SandboxExecutor sandboxExecutor;
```

> 주의: `SandboxPool`과 `SandboxExecutor`가 이미 주입되어 있는지 확인할 것. 현재 `ChoiceSetGenerationService`는 `SandboxValidator`를 통해 간접 사용 중 — 직접 주입이 필요하다.

- [ ] **Step 2: `generateResultMatch()` 메서드 추가**

클래스 내부(기존 `generate()` 메서드 아래)에 추가:

```java
/**
 * RESULT_MATCH 전용: answerSql을 Sandbox에서 실행 후 결과를 AI에 전달하여
 * 정답 결과 JSON 1개 + 오답 결과 JSON 3개를 생성한다.
 * Sandbox는 1회만 사용(answerSql 실행용) — 검증은 JSON 비교로 처리.
 */
public QuestionChoiceSet generateResultMatch(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
    Question question = questionService.getQuestionEntity(questionUuid);

    // schemaDdl 없이는 Sandbox 실행 불가
    if (question.getSchemaDdl() == null || question.getSchemaDdl().isBlank()) {
        throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED, "RESULT_MATCH는 schemaDdl이 필수입니다.");
    }
    if (question.getAnswerSql() == null || question.getAnswerSql().isBlank()) {
        throw new CustomException(ErrorCode.SANDBOX_ANSWER_SQL_FAILED, "RESULT_MATCH는 answerSql이 필수입니다.");
    }

    PromptTemplate prompt = promptService.getActivePrompt(RESULT_MATCH_PROMPT_KEY);
    log.debug("[choice-gen-result-match] 요청 시작: questionUuid={}", questionUuid);

    // answerSql을 Sandbox에서 1회 실행 — 이 결과를 AI 컨텍스트 + 검증에 재사용
    ExecuteResult expectedResult = executeSandboxOnce(question);
    log.debug("[choice-gen-result-match] answerSql 실행 완료: rowCount={}", expectedResult.rowCount());

    // answerSql 결과를 JSON 문자열로 직렬화하여 AI 컨텍스트로 제공
    String answerResultJson = serializeExecuteResult(expectedResult);

    GenerateChoiceSetResult lastResult = null;
    ErrorCode lastErrorCode = null;

    for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
        try {
            log.debug("[choice-gen-result-match] AI 호출 시작: attempt={}/{}", attempts, MAX_ATTEMPTS);
            GenerateChoiceSetRequest req = buildResultMatchRequest(question, prompt, answerResultJson);
            lastResult = aiGatewayClient.generateChoiceSet(req);
            log.debug("[choice-gen-result-match] AI 응답 수신: choiceCount={}", lastResult.choices().size());

            // JSON 비교 검증 (Sandbox 재호출 없음)
            ValidationReport report = sandboxValidator.validateResultMatch(lastResult.choices(), expectedResult);
            log.debug("[choice-gen-result-match] 검증 완료: correctCount={}", report.correctCount());

            if (report.correctCount() == 1) {
                log.debug("[choice-gen-result-match] 검증 통과, 저장: attempt={}", attempts);
                return choiceSetSaveService.saveResultMatch(
                        question, source, memberUuid, prompt, lastResult, report, attempts);
            }

            lastErrorCode = (report.correctCount() == 0)
                    ? ErrorCode.CHOICE_SET_VALIDATION_NO_CORRECT
                    : ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT;
            log.info("[choice-gen-result-match] validation failed: code={}, attempt={}/{}",
                    lastErrorCode, attempts, MAX_ATTEMPTS);

        } catch (CustomException e) {
            ErrorCode ec = e.getErrorCode();
            if (ec == ErrorCode.SANDBOX_SETUP_FAILED
                    || ec == ErrorCode.SANDBOX_ANSWER_SQL_FAILED
                    || ec == ErrorCode.AI_FALLBACK_FAILED) {
                log.error("[choice-gen-result-match] 재시도 불가 에러: code={}, attempt={}", ec, attempts);
                choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, attempts, ec);
                throw e;
            }
            lastErrorCode = ec;
            log.warn("[choice-gen-result-match] transient error, retrying: code={}, attempt={}/{}",
                    ec, attempts, MAX_ATTEMPTS);
        }
    }

    log.error("[choice-gen-result-match] 최대 재시도 초과: questionUuid={}, lastErrorCode={}", questionUuid, lastErrorCode);
    choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
    throw new CustomException(
            lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
            "result-match questionUuid=" + questionUuid);
}

/**
 * answerSql을 Sandbox에서 실행하고 결과를 반환한다.
 * Sandbox 획득·해제를 포함한 완전한 사이클.
 */
private ExecuteResult executeSandboxOnce(Question question) {
    String dbName = sandboxPool.acquire();
    try {
        String setupSql = question.getSchemaDdl();
        if (question.getSchemaSampleData() != null && !question.getSchemaSampleData().isBlank()) {
            setupSql = setupSql + ";\n" + question.getSchemaSampleData();
        }
        sandboxExecutor.applyDdl(dbName, setupSql);

        ExecuteResult result = sandboxExecutor.execute(dbName, question.getAnswerSql());
        if (!"OK".equals(result.status())) {
            throw new CustomException(ErrorCode.SANDBOX_ANSWER_SQL_FAILED,
                    "RESULT_MATCH answerSql 실행 실패: " + result.errorMessage());
        }
        return result;
    } finally {
        sandboxPool.release(dbName);
    }
}

/**
 * ExecuteResult를 사람이 읽기 쉬운 형태로 직렬화하여 AI 컨텍스트로 제공한다.
 * 형식: "COLUMN1, COLUMN2\nVAL1, VAL2\nVAL3, VAL4"
 */
private String serializeExecuteResult(ExecuteResult result) {
    if (result.rows().isEmpty()) {
        return "(결과 없음)";
    }
    StringBuilder sb = new StringBuilder();
    sb.append(String.join(", ", result.columns()));
    for (var row : result.rows()) {
        sb.append("\n");
        sb.append(row.stream().map(v -> String.valueOf(v)).reduce((a, b) -> a + ", " + b).orElse(""));
    }
    return sb.toString();
}

/**
 * RESULT_MATCH 전용 AI 요청 빌드 — answerSql 실행 결과를 추가 컨텍스트로 포함.
 */
private GenerateChoiceSetRequest buildResultMatchRequest(
        Question question, PromptTemplate prompt, String answerResultJson) {

    ChoiceSetContextDto context = new ChoiceSetContextDto(
            question.getQuestionUuid(),
            question.getStem(),
            question.getAnswerSql(),
            question.getSchemaDdl(),
            question.getSchemaSampleData(),
            question.getSchemaIntent(),
            question.getDifficulty()
    );

    Map<String, Object> responseSchema = Map.of(
            "type", "object",
            "properties", Map.of(
                    "choices", Map.of(
                            "type", "array",
                            "minItems", 4, "maxItems", 4,
                            "items", Map.of(
                                    "type", "object",
                                    "properties", Map.of(
                                            "key", Map.of("type", "string"),
                                            "body", Map.of("type", "string"),
                                            "is_correct", Map.of("type", "boolean"),
                                            "rationale", Map.of("type", "string")
                                    ),
                                    "required", List.of("key", "body", "is_correct", "rationale")
                            )
                    )
            ),
            "required", List.of("choices")
    );

    // user_template의 {answer_result} 플레이스홀더를 실제 실행 결과로 대체하기 위해
    // ChoiceSetContextDto 확장 대신 별도 필드로 처리 — AI Gateway에서 템플릿 치환 시 사용됨.
    // 현재 ChoiceSetContextDto에 answerResult 필드가 없으면 추가 필요.
    // → 방어적으로 user_template을 직접 치환하여 전달한다.
    String userPrompt = prompt.getUserTemplate()
            .replace("{answer_result}", answerResultJson);

    LlmConfigDto llmConfig = new LlmConfigDto(
            prompt.getModel(),
            prompt.getSystemPrompt(),
            userPrompt,           // 치환된 user prompt 직접 전달
            prompt.getTemperature(),
            prompt.getMaxTokens(),
            responseSchema
    );

    return new GenerateChoiceSetRequest(context, llmConfig);
}
```

> **주의**: `LlmConfigDto` 생성자에서 `userTemplate` 대신 이미 치환된 프롬프트 문자열을 전달하는 방식이 AI Gateway에서 지원되는지 확인 필요. AI Gateway가 `userTemplate`을 자체적으로 치환한다면 이중 치환이 발생할 수 있음. 확인 후 `ChoiceSetContextDto`에 `answerResult` 필드를 추가하는 방향으로 수정할 것.

---

## Task 5: ChoiceSetSaveService — saveResultMatch() 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java`

- [ ] **Step 1: `saveResultMatch()` 메서드 추가**

`saveConceptSuccess()` 메서드 아래에 추가:

```java
/**
 * RESULT_MATCH 선택지 세트 성공 저장.
 * kind=TEXT, is_correct=샌드박스 검증 결과 기반(ValidationReport).
 */
@Transactional
public QuestionChoiceSet saveResultMatch(
        Question question, ChoiceSetSource source, UUID memberUuid,
        PromptTemplate prompt, GenerateChoiceSetResult result,
        ValidationReport report, int attempts) {

    QuestionChoiceSet set = QuestionChoiceSet.builder()
            .questionUuid(question.getQuestionUuid())
            .source(source)
            .status(ChoiceSetStatus.OK)
            .generatedForMemberUuid(memberUuid)
            .promptTemplateUuid(prompt.getPromptTemplateUuid())
            .modelName(prompt.getModel())
            .temperature(prompt.getTemperature())
            .maxTokens(prompt.getMaxTokens())
            .generationAttempts(attempts)
            .sandboxValidationPassed(true) // answerSql 실행 + JSON 비교 검증 통과
            .isReusable(false)
            .totalElapsedMs(result.metadata() != null ? result.metadata().elapsedMs() : 0)
            .build();
    set = choiceSetRepository.saveAndFlush(set);

    List<GeneratedChoiceDto> choices = result.choices();
    for (int i = 0; i < choices.size(); i++) {
        GeneratedChoiceDto c = choices.get(i);
        // is_correct는 AI 판단이 아닌 검증 결과 기반으로 덮어쓰기
        boolean correct = report.items().get(i).matchesExpected();
        QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                .choiceSetUuid(set.getChoiceSetUuid())
                .choiceKey(c.key())
                .sortOrder(i)
                .kind(ChoiceKind.TEXT)   // RESULT_MATCH는 항상 TEXT
                .body(c.body())          // JSON 배열 문자열
                .isCorrect(correct)
                .rationale(c.rationale())
                .build();
        choiceSetItemRepository.save(item);
    }

    log.info("[choice-gen-result-match] success: questionUuid={}, attempts={}, setUuid={}",
            question.getQuestionUuid(), attempts, set.getChoiceSetUuid());
    return set;
}
```

---

## Task 6: ChoiceSetResolver — RESULT_MATCH case 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetResolver.java`

- [ ] **Step 1: switch에 RESULT_MATCH case 추가**

`resolveForUser()` 메서드의 switch 블록을 다음과 같이 수정:

```java
switch (question.getChoiceSetPolicy()) {
    case AI_ONLY:
        return resolveAiOnly(questionUuid, memberUuid);
    case ODD_ONE_OUT:
        return resolveAiOnly(questionUuid, memberUuid);
    case RESULT_MATCH:
        return resolveResultMatch(questionUuid, memberUuid);
    case CURATED_ONLY:
        throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                "CURATED_ONLY 정책은 아직 지원되지 않습니다.");
    case HYBRID:
        throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                "HYBRID 정책은 아직 지원되지 않습니다.");
    default:
        throw new CustomException(ErrorCode.CHOICE_SET_POLICY_NOT_IMPLEMENTED,
                "알 수 없는 정책: " + question.getChoiceSetPolicy());
}
```

- [ ] **Step 2: `resolveResultMatch()` private 메서드 추가**

클래스 내부에 추가:

```java
/**
 * RESULT_MATCH 문제: 프리페치 캐시 조회 후 없으면 실시간 생성.
 * AI가 answerSql 실행 결과를 기반으로 JSON 배열 선택지를 생성한다.
 */
private QuestionChoiceSet resolveResultMatch(UUID questionUuid, UUID memberUuid) {
    Optional<QuestionChoiceSet> prefetched = choiceSetRepository
            .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                    questionUuid, memberUuid,
                    ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);

    if (prefetched.isPresent()) {
        QuestionChoiceSet set = prefetched.get();
        markConsumed(set);
        log.info("[resolver] result-match prefetch HIT: questionUuid={}, setUuid={}",
                questionUuid, set.getChoiceSetUuid());
        return set;
    }

    log.info("[resolver] result-match MISS, runtime generation: questionUuid={}", questionUuid);
    return choiceSetGenerationService.generateResultMatch(questionUuid, memberUuid, ChoiceSetSource.AI_RUNTIME);
}
```

---

## Task 7: 프론트 타입 업데이트

**Files:**
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: `ChoiceSetPolicy`에 `RESULT_MATCH` 추가**

```typescript
// 수정 전
export type ChoiceSetPolicy = "AI_ONLY" | "ODD_ONE_OUT" | "CURATED_ONLY" | "HYBRID";

// 수정 후
// RESULT_MATCH: "다음 SQL의 실행 결과로 올바른 것은?" 유형 — 선택지 body가 JSON 배열
export type ChoiceSetPolicy = "AI_ONLY" | "ODD_ONE_OUT" | "CURATED_ONLY" | "HYBRID" | "RESULT_MATCH";
```

---

## Task 8: ResultMatchTable 컴포넌트 신규 생성

**Files:**
- Create: `client/src/components/ResultMatchTable.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
import { memo } from "react";

interface ResultMatchTableProps {
  /** JSON 배열 형태의 선택지 body 문자열 */
  readonly body: string;
}

/**
 * RESULT_MATCH 선택지용 컴팩트 결과 테이블.
 * body는 JSON 배열 문자열 ([{"COL":"VAL",...}]) — 파싱 후 테이블로 렌더링.
 * 실행 상태(성공/실패) 표시 없음 — 순수 데이터 테이블.
 */
export const ResultMatchTable = memo(function ResultMatchTable({ body }: ResultMatchTableProps) {
  // JSON 파싱 — 실패 시 raw body 텍스트 표시
  let rows: Record<string, unknown>[] = [];
  let parseError = false;

  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  if (parseError) {
    // 파싱 실패 시 원문 텍스트 표시 (CONCEPT_ONLY 텍스트 선택지 폴백)
    return <p className="text-body text-sm mt-2">{body}</p>;
  }

  // 빈 결과
  if (rows.length === 0) {
    return (
      <div className="mt-2 p-2 rounded" style={{ background: "var(--color-code-bg)" }}>
        <p className="text-caption text-sm text-center">(결과 없음)</p>
      </div>
    );
  }

  // 열 이름은 첫 번째 행의 키에서 추출
  const columns = Object.keys(rows[0]);

  return (
    <div className="mt-2 overflow-x-auto rounded" style={{ maxHeight: "200px", overflowY: "auto" }}>
      <table className="data-table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col}>{String(row[col] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
```

---

## Task 9: ChoiceCard — RESULT_MATCH 렌더링 분기

**Files:**
- Modify: `client/src/components/ChoiceCard.tsx`

- [ ] **Step 1: `ResultMatchTable` import 추가 및 렌더링 분기 구현**

```tsx
import { memo } from "react";
import type { ChoiceItem, ExecuteResult } from "../types/api";
import { ResultTable } from "./ResultTable";
import { ResultMatchTable } from "./ResultMatchTable";

interface ChoiceCardProps {
  readonly choice: ChoiceItem;
  readonly isSelected: boolean;
  readonly cached: ExecuteResult | undefined;
  readonly isExecutable: boolean;
  readonly isExecuting: boolean;
  readonly onSelect: (key: string, sql: string) => void;
  readonly onExecute: (key: string, sql: string) => void;
  readonly onAskAi?: (choiceKey: string, errorCode: string, errorMessage: string) => void;
}

/** body가 JSON 배열인지 판별 — RESULT_MATCH 선택지 감지용 */
function isJsonArray(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

export const ChoiceCard = memo(function ChoiceCard({
  choice,
  isSelected,
  cached,
  isExecutable,
  isExecuting,
  onSelect,
  onExecute,
  onAskAi,
}: ChoiceCardProps) {
  const borderClass = isSelected ? "border-brand border-2" : "border-border";

  // RESULT_MATCH 선택지 판별: kind===TEXT + body가 JSON 배열
  const isResultMatch = choice.kind === "TEXT" && isJsonArray(choice.body);
  // CONCEPT_ONLY 텍스트 선택지: kind===TEXT + body가 JSON 배열 아님
  const isConceptText = choice.kind === "TEXT" && !isJsonArray(choice.body);

  return (
    <div className={`card-base ${borderClass}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={`radio-custom mt-0.5 shrink-0 ${isSelected ? "radio-custom--selected" : ""}`}
          onClick={() => onSelect(choice.key, choice.body)}
          aria-label={`선택지 ${choice.key}`}
        />
        <div className="flex-1 min-w-0">
          <span className="text-body font-bold text-sm mb-2 block">{choice.key}</span>

          {isResultMatch ? (
            // RESULT_MATCH: JSON 배열 → 컴팩트 결과 테이블 렌더링, 실행 버튼 없음
            <ResultMatchTable body={choice.body} />
          ) : isConceptText ? (
            // CONCEPT_ONLY: 일반 텍스트 렌더링
            <p className="text-body text-sm">{choice.body}</p>
          ) : (
            // EXECUTABLE SQL: 코드 블록 + 실행 버튼
            <>
              <pre className="code-block text-sm"><code>{choice.body}</code></pre>
              {isExecutable && (
                <div className="flex justify-end mt-2">
                  <button
                    className="btn-compact"
                    type="button"
                    onClick={() => onExecute(choice.key, choice.body)}
                    disabled={!!cached || isExecuting}
                  >
                    {isExecuting ? "실행 중..." : "실행"}
                  </button>
                </div>
              )}
              {cached && (
                <ResultTable
                  result={cached}
                  onAskAi={
                    cached.errorCode
                      ? () => onAskAi?.(choice.key, cached.errorCode ?? "", cached.errorMessage ?? "")
                      : undefined
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
```

---

## Task 10: QuestionDetail — isExecutable 판별 수정

**Files:**
- Modify: `client/src/pages/QuestionDetail.tsx`

- [ ] **Step 1: `isExecutable` 전달 시 RESULT_MATCH 예외 처리**

`choicesSection` 내 `ChoiceCard` 렌더링 부분에서 `isExecutable` prop 수정:

```tsx
// 수정 전
isExecutable={question.executionMode === "EXECUTABLE"}

// 수정 후: RESULT_MATCH 선택지는 JSON 배열이므로 실행 불필요 — 버튼 숨김
isExecutable={
  question.executionMode === "EXECUTABLE" &&
  question.choiceSetPolicy !== "RESULT_MATCH"
}
```

또한 `handleSelect` 콜백에서도 동일하게 적용 (RESULT_MATCH는 선택 시 자동 실행 안 함):

```tsx
const handleSelect = useCallback(
  (choiceKey: string, sql: string) => {
    setSelectedKey(choiceKey);
    // RESULT_MATCH는 body가 SQL이 아니므로 자동 실행 건너뜀
    if (
      question?.executionMode === "EXECUTABLE" &&
      question.choiceSetPolicy !== "RESULT_MATCH" &&
      !executeCacheRef.current[choiceKey]
    ) {
      handleExecute(choiceKey, sql);
    }
  },
  [handleExecute, question],
);
```

---

## Task 11: 가이드라인 문서 업데이트

**Files:**
- Modify: `server/PQL-Web/src/main/resources/static/docs/question-register-guide.md`
- Modify: `server/PQL-Web/src/main/resources/static/docs/question-bulk-guide.md`

- [ ] **Step 1: 두 가이드라인 파일에 RESULT_MATCH 정책 섹션 추가**

각 파일의 `choiceSetPolicy` 설명 섹션에 다음 내용 추가 (기존 AI_ONLY, ODD_ONE_OUT 설명 아래):

```markdown
### `RESULT_MATCH` — "다음 SQL의 실행 결과로 올바른 것은?"

| 항목 | 내용 |
|------|------|
| 문제 유형 | 사용자가 SQL을 머릿속으로 실행해 올바른 결과 테이블을 고르는 유형 |
| 선택지 형태 | 실행 결과 테이블 (JSON 배열로 자동 생성) |
| 필수 조건 | `executionMode = EXECUTABLE` |
| 필수 필드 | `answerSql`, `schemaDdl`, `schemaSampleData` |
| 선택지 생성 | AI가 answerSql 실행 결과 기준으로 정답 1개 + 오답 3개 자동 생성 |
| 검증 방식 | JSON 비교 (Sandbox SQL 실행 아님) |
| 프론트 렌더링 | 컴팩트 결과 테이블로 표시, 실행 버튼 없음 |

**등록 예시 (단건 등록):**
- `choiceSetPolicy`: `RESULT_MATCH`
- `executionMode`: `EXECUTABLE`
- `answerSql`: `SELECT A.NAME, B.DEPT_NAME FROM EMP A INNER JOIN DEPT B ON A.DEPT_ID = B.DEPT_ID WHERE B.DEPT_NAME = '개발팀'`
- `schemaDdl`: (EMP, DEPT 테이블 CREATE 구문)
- `schemaSampleData`: (INSERT 구문)

> 선택지 body는 관리자가 직접 작성하지 않아도 됩니다. AI가 answerSql 실행 결과를 기반으로 자동 생성합니다.
```

---

## Self-Review

### Spec 커버리지 확인

| 요구사항 | 커버 태스크 |
|---------|------------|
| `ChoiceSetPolicy.RESULT_MATCH` 추가 | Task 1 |
| `generate_choice_set_result_match` 프롬프트 마이그레이션 | Task 2 |
| `ChoiceSetGenerationService.generateResultMatch()` | Task 4 |
| `SandboxValidator.validateResultMatch()` | Task 3 |
| `ChoiceSetSaveService.saveResultMatch()`, kind=TEXT | Task 5 |
| `ChoiceSetResolver` RESULT_MATCH 분기 | Task 6 |
| 프론트 `ChoiceSetPolicy` 타입 업데이트 | Task 7 |
| `ResultMatchTable` 컴포넌트 신규 | Task 8 |
| `ChoiceCard` 렌더링 분기 | Task 9 |
| `QuestionDetail` isExecutable 수정 | Task 10 |
| 가이드라인 문서 업데이트 | Task 11 |

### 잠재적 이슈

1. **AI Gateway `userTemplate` 처리**: Task 4의 `buildResultMatchRequest()`에서 `{answer_result}` 플레이스홀더를 직접 치환 후 전달한다. AI Gateway가 `userTemplate`을 자체 치환한다면 `ChoiceSetContextDto`에 `answerResult` 필드 추가가 필요할 수 있음. 구현 시 `AiGatewayClient.generateChoiceSet()` 내부 동작 확인 필요.

2. **`ChoiceSetGenerationService`의 `SandboxPool/SandboxExecutor` 직접 주입**: 현재 `SandboxValidator`를 통해 간접 사용 중. Task 4 구현 시 빌드 오류 없는지 확인.

3. **`ValidationReport.items()` 인덱스 정합**: `report.items().get(i)`는 AI 응답 choices와 순서가 동일하다는 가정. `sandboxValidator.validateResultMatch()`가 입력 choices 순서 그대로 validations를 생성하는지 확인 (Task 3 코드에서 for-each 순서 유지됨 — OK).
