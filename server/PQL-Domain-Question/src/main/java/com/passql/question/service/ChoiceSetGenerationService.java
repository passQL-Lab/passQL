package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.ValidationReport;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AI 선택지 세트 생성 + 샌드박스 검증 재시도 루프.
 * <p>
 * 비트랜잭션 — AI·샌드박스 호출이 수 초 걸리므로 긴 트랜잭션 금지.
 * save는 ChoiceSetSaveService(별도 빈)에 위임하여 self-invocation 문제 방지.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChoiceSetGenerationService {

    private static final int MAX_ATTEMPTS = 3;
    private static final String PROMPT_KEY = "generate_choice_set";
    // CONCEPT_ONLY 전용 프롬프트 키 — Sandbox 없이 텍스트 선택지 생성
    private static final String CONCEPT_PROMPT_KEY = "generate_choice_set_concept";
    // RESULT_MATCH 전용 프롬프트 키 — answerSql 실행 결과 JSON을 컨텍스트로 제공
    private static final String RESULT_MATCH_PROMPT_KEY = "generate_choice_set_result_match";

    private final QuestionService questionService;
    private final PromptService promptService;
    private final AiGatewayClient aiGatewayClient;
    private final SandboxValidator sandboxValidator;
    private final ChoiceSetSaveService choiceSetSaveService;
    private final SandboxPool sandboxPool;
    private final SandboxExecutor sandboxExecutor;

    /**
     * CONCEPT_ONLY 전용: Sandbox 없이 AI가 텍스트 선택지를 생성한다.
     * AI의 is_correct를 그대로 신뢰하여 저장 (별도 검증 없음).
     * 최대 3회 재시도 — AI가 정확히 is_correct=true인 선택지를 1개 내려줄 때 성공.
     */
    public QuestionChoiceSet generateConcept(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
        Question question = questionService.getQuestionEntity(questionUuid);
        PromptTemplate prompt = promptService.getActivePrompt(CONCEPT_PROMPT_KEY);
        GenerateChoiceSetRequest req = buildConceptRequest(question, prompt);
        log.debug("[choice-gen-concept] 요청 빌드 완료: questionUuid={}, promptKey={}", questionUuid, CONCEPT_PROMPT_KEY);

        GenerateChoiceSetResult lastResult = null;
        ErrorCode lastErrorCode = null;

        for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
            try {
                log.debug("[choice-gen-concept] AI 호출 시작: attempt={}/{}, questionUuid={}", attempts, MAX_ATTEMPTS, questionUuid);
                lastResult = aiGatewayClient.generateChoiceSet(req);
                log.debug("[choice-gen-concept] AI 응답 수신: attempt={}, choiceCount={}, questionUuid={}",
                        attempts, lastResult.choices().size(), questionUuid);

                // AI가 내려준 is_correct 집계 — 1개여야 유효
                long correctCount = lastResult.choices().stream()
                        .filter(c -> Boolean.TRUE.equals(c.isCorrect()))
                        .count();
                log.debug("[choice-gen-concept] is_correct 집계: correctCount={}, attempt={}, questionUuid={}",
                        correctCount, attempts, questionUuid);

                if (correctCount == 1) {
                    log.debug("[choice-gen-concept] 검증 통과, 저장 시작: attempt={}, questionUuid={}", attempts, questionUuid);
                    return choiceSetSaveService.saveConceptSuccess(
                            question, source, memberUuid, prompt, lastResult, attempts);
                }

                lastErrorCode = (correctCount == 0)
                        ? ErrorCode.CHOICE_SET_VALIDATION_NO_CORRECT
                        : ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT;
                log.info("[choice-gen-concept] validation failed: code={}, attempt={}/{}, questionUuid={}",
                        lastErrorCode, attempts, MAX_ATTEMPTS, questionUuid);

            } catch (CustomException e) {
                if (e.getErrorCode() == ErrorCode.AI_FALLBACK_FAILED) {
                    log.error("[choice-gen-concept] AI fallback 실패, 재시도 불가: attempt={}, questionUuid={}", attempts, questionUuid);
                    choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, attempts, e.getErrorCode());
                    throw e;
                }
                lastErrorCode = e.getErrorCode();
                log.warn("[choice-gen-concept] transient error, retrying: code={}, attempt={}/{}",
                        lastErrorCode, attempts, MAX_ATTEMPTS);
            }
        }

        log.error("[choice-gen-concept] 최대 재시도 초과: questionUuid={}, lastErrorCode={}", questionUuid, lastErrorCode);
        choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
        throw new CustomException(
                lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
                "concept questionUuid=" + questionUuid);
    }

    /**
     * 선택지 세트를 AI로 생성하고 샌드박스로 검증한다.
     * 최대 3회 재시도 후 실패 시 CustomException을 던진다.
     * <p>
     * MULTIPLE_CORRECT 실패 시 이전 시도에서 정답과 동일한 결과를 낸 오답 SQL을
     * 피드백으로 누적하여 다음 AI 요청에 포함한다.
     * 이를 통해 AI가 같은 SQL 동치(equivalence) 실수를 반복하는 것을 방지한다.
     */
    public QuestionChoiceSet generate(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
        Question question = questionService.getQuestionEntity(questionUuid);
        PromptTemplate prompt = promptService.getActivePrompt(PROMPT_KEY);
        log.debug("[choice-gen] 요청 빌드 완료: questionUuid={}, promptKey={}", questionUuid, PROMPT_KEY);

        ValidationReport lastReport = null;
        GenerateChoiceSetResult lastResult = null;
        ErrorCode lastErrorCode = null;

        // MULTIPLE_CORRECT 실패 시 정답과 동일한 결과를 낸 오답 SQL 누적 (피드백용)
        List<String> equivalentSqls = new ArrayList<>();

        for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
            // 재시도마다 피드백(동치 SQL 목록)을 포함한 요청을 새로 빌드
            GenerateChoiceSetRequest req = buildRequest(question, prompt, equivalentSqls);

            try {
                log.debug("[choice-gen] AI 호출 시작: attempt={}/{}, questionUuid={}, feedbackCount={}",
                        attempts, MAX_ATTEMPTS, questionUuid, equivalentSqls.size());
                lastResult = aiGatewayClient.generateChoiceSet(req);
                log.debug("[choice-gen] AI 응답 수신: attempt={}, choiceCount={}, questionUuid={}",
                        attempts, lastResult.choices().size(), questionUuid);

                log.debug("[choice-gen] Sandbox 검증 시작: attempt={}, questionUuid={}", attempts, questionUuid);
                // policy를 validator에 전달 — ODD_ONE_OUT 유형은 다른 검증 로직 적용
                lastReport = sandboxValidator.validate(
                        lastResult.choices(),
                        question.getAnswerSql(),
                        question.getSchemaDdl(),
                        question.getSchemaSampleData(),
                        question.getChoiceSetPolicy());
                log.debug("[choice-gen] Sandbox 검증 완료: attempt={}, correctCount={}, questionUuid={}",
                        attempts, lastReport.correctCount(), questionUuid);

                if (lastReport.correctCount() == 1) {
                    log.debug("[choice-gen] 검증 통과, 저장 시작: attempt={}, questionUuid={}", attempts, questionUuid);
                    return choiceSetSaveService.saveSuccess(
                            question, source, memberUuid, prompt, lastResult, lastReport, attempts);
                }

                lastErrorCode = (lastReport.correctCount() == 0)
                        ? ErrorCode.CHOICE_SET_VALIDATION_NO_CORRECT
                        : ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT;
                log.info("[choice-gen] validation failed: code={}, attempt={}/{}, questionUuid={}",
                        lastErrorCode, attempts, MAX_ATTEMPTS, questionUuid);

                // MULTIPLE_CORRECT 실패 시 정답과 동치인 오답 SQL을 피드백 목록에 누적
                // 다음 시도에서 AI가 동일한 SQL을 생성하지 않도록 명시적으로 금지
                if (lastErrorCode == ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT
                        && lastResult != null) {
                    collectEquivalentSqls(lastResult.choices(), lastReport, equivalentSqls);
                    log.info("[choice-gen] 동치 SQL 피드백 누적: count={}, attempt={}, questionUuid={}",
                            equivalentSqls.size(), attempts, questionUuid);
                }

            } catch (CustomException e) {
                ErrorCode ec = e.getErrorCode();
                // 재시도 불가 에러는 즉시 실패 저장 후 throw
                if (ec == ErrorCode.SANDBOX_SETUP_FAILED
                        || ec == ErrorCode.SANDBOX_ANSWER_SQL_FAILED
                        || ec == ErrorCode.AI_FALLBACK_FAILED) {
                    log.error("[choice-gen] 재시도 불가 에러: code={}, attempt={}, questionUuid={}", ec, attempts, questionUuid);
                    choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, attempts, ec);
                    throw e;
                }
                // 재시도 가능 에러 (파싱 실패, 스키마 위반 등)
                lastErrorCode = ec;
                log.warn("[choice-gen] transient error, retrying: code={}, attempt={}/{}",
                        ec, attempts, e);
            }
        }

        // 3회 다 실패
        log.error("[choice-gen] 최대 재시도 초과: questionUuid={}, lastErrorCode={}", questionUuid, lastErrorCode);
        choiceSetSaveService.saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
        throw new CustomException(
                lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
                "questionUuid=" + questionUuid + ", source=" + source);
    }

    /**
     * MULTIPLE_CORRECT 실패 시 정답과 동치(동일 결과)인 오답 SQL을 피드백 목록에 추가한다.
     * AI가 is_correct=false로 설정했지만 sandbox 결과 matchesExpected=true인 선택지를 수집한다.
     */
    private void collectEquivalentSqls(
            List<GeneratedChoiceDto> choices,
            ValidationReport report,
            List<String> equivalentSqls
    ) {
        // ValidationReport.items에서 matchesExpected=true인 선택지 key를 맵핑
        Map<String, Boolean> matchMap = new HashMap<>();
        for (var cv : report.items()) {
            matchMap.put(cv.key(), cv.matchesExpected());
        }

        for (GeneratedChoiceDto choice : choices) {
            // sandbox에서 matchesExpected=true로 판정된 SQL을 모두 수집
            // AI의 is_correct 판단과 무관하게 — MULTIPLE_CORRECT 상황에서 동치인 SQL 전부가 피드백 대상
            if (Boolean.TRUE.equals(matchMap.get(choice.key()))) {
                if (choice.body() != null && !choice.body().isBlank()
                        && !equivalentSqls.contains(choice.body())) {
                    equivalentSqls.add(choice.body());
                }
            }
        }
    }

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

        // answerSql 결과를 텍스트로 직렬화하여 AI 컨텍스트로 제공
        String answerResultText = serializeExecuteResult(expectedResult);

        GenerateChoiceSetResult lastResult = null;
        ErrorCode lastErrorCode = null;

        for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
            try {
                log.debug("[choice-gen-result-match] AI 호출 시작: attempt={}/{}", attempts, MAX_ATTEMPTS);
                GenerateChoiceSetRequest req = buildResultMatchRequest(question, prompt, answerResultText);
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
     * ExecuteResult를 사람이 읽기 쉬운 텍스트로 직렬화하여 AI 컨텍스트로 제공한다.
     * 형식: "COLUMN1, COLUMN2\nVAL1, VAL2\nVAL3, VAL4"
     * <p>
     * 보안: DB 값에 {placeholder} 형태의 문자열이 있으면 프롬프트 치환 로직을 오염시킬 수 있어
     * 중괄호를 대괄호로 치환하여 치환 대상에서 제외한다.
     */
    private String serializeExecuteResult(ExecuteResult result) {
        if (result.rows().isEmpty()) {
            return "(결과 없음)";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(", ", result.columns()));
        for (var row : result.rows()) {
            sb.append("\n");
            List<String> vals = new ArrayList<>();
            for (Object v : row) {
                // 중괄호를 대괄호로 치환 — {placeholder} 패턴 오염 방지
                vals.add(String.valueOf(v).replace("{", "[").replace("}", "]"));
            }
            sb.append(String.join(", ", vals));
        }
        return sb.toString();
    }

    /**
     * RESULT_MATCH 전용 AI 요청 빌드 — answerSql 실행 결과를 user prompt에 직접 치환하여 포함.
     */
    private GenerateChoiceSetRequest buildResultMatchRequest(
            Question question, PromptTemplate prompt, String answerResultText) {

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

        // {answer_result} 플레이스홀더를 실행 결과 텍스트로 치환하여 AI에 전달
        String userPrompt = prompt.getUserTemplate()
                .replace("{answer_result}", answerResultText);

        LlmConfigDto llmConfig = new LlmConfigDto(
                prompt.getModel(),
                prompt.getSystemPrompt(),
                userPrompt,
                prompt.getTemperature(),
                prompt.getMaxTokens(),
                responseSchema
        );

        return new GenerateChoiceSetRequest(context, llmConfig);
    }

    /**
     * CONCEPT_ONLY 전용 요청 빌드 — stem + hint만 사용, SQL 관련 필드는 null.
     */
    private GenerateChoiceSetRequest buildConceptRequest(Question question, PromptTemplate prompt) {
        // hint를 stem에 병합하여 AI 컨텍스트로 제공 (ChoiceSetContextDto는 hint 필드 없음)
        String stemWithHint = question.getStem()
                + (question.getHint() != null && !question.getHint().isBlank()
                ? "\n\n[힌트] " + question.getHint() : "");

        ChoiceSetContextDto context = new ChoiceSetContextDto(
                question.getQuestionUuid(),
                stemWithHint,
                null,  // CONCEPT_ONLY — 정답 SQL 없음
                null,  // CONCEPT_ONLY — 스키마 DDL 없음
                null,  // CONCEPT_ONLY — 샘플 데이터 없음
                null,  // CONCEPT_ONLY — 스키마 의도 없음
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

        LlmConfigDto llmConfig = new LlmConfigDto(
                prompt.getModel(),
                prompt.getSystemPrompt(),
                prompt.getUserTemplate(),
                prompt.getTemperature(),
                prompt.getMaxTokens(),
                responseSchema
        );

        return new GenerateChoiceSetRequest(context, llmConfig);
    }

    /**
     * AI_ONLY 선택지 생성 요청을 빌드한다.
     * equivalentSqls가 있으면 user prompt 하단에 "이미 동치임이 확인된 SQL은 피해라" 피드백을 추가한다.
     * 이를 통해 재시도 시 AI가 동일한 SQL 동치 실수를 반복하지 않도록 유도한다.
     */
    private GenerateChoiceSetRequest buildRequest(
            Question question, PromptTemplate prompt, List<String> equivalentSqls) {
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

        // 이전 시도에서 정답과 동치임이 확인된 SQL들을 피드백으로 user prompt에 추가
        String userTemplate = prompt.getUserTemplate();
        if (!equivalentSqls.isEmpty()) {
            StringBuilder feedback = new StringBuilder("\n\n[재시도 피드백]\n");
            feedback.append("아래 SQL들은 기준 SQL과 동일한 실행 결과를 내는 것으로 확인되었다.\n");
            feedback.append("오답 선택지로 절대 사용하지 말 것:\n");
            for (int i = 0; i < equivalentSqls.size(); i++) {
                feedback.append(i + 1).append(". ").append(equivalentSqls.get(i)).append("\n");
            }
            feedback.append("위 SQL과 다른 표현/문법으로 명확히 다른 결과를 내는 오답 SQL을 생성해야 한다.");
            userTemplate = userTemplate + feedback;
        }

        LlmConfigDto llmConfig = new LlmConfigDto(
                prompt.getModel(),
                prompt.getSystemPrompt(),
                userTemplate,
                prompt.getTemperature(),
                prompt.getMaxTokens(),
                responseSchema
        );

        return new GenerateChoiceSetRequest(context, llmConfig);
    }
}
