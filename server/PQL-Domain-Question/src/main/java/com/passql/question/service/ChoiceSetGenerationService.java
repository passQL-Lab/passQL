package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.dto.ValidationReport;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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

    private final QuestionService questionService;
    private final PromptService promptService;
    private final AiGatewayClient aiGatewayClient;
    private final SandboxValidator sandboxValidator;
    private final ChoiceSetSaveService choiceSetSaveService;

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
     */
    public QuestionChoiceSet generate(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
        Question question = questionService.getQuestionEntity(questionUuid);
        PromptTemplate prompt = promptService.getActivePrompt(PROMPT_KEY);
        GenerateChoiceSetRequest req = buildRequest(question, prompt);
        log.debug("[choice-gen] 요청 빌드 완료: questionUuid={}, promptKey={}", questionUuid, PROMPT_KEY);

        ValidationReport lastReport = null;
        GenerateChoiceSetResult lastResult = null;
        ErrorCode lastErrorCode = null;

        for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
            try {
                log.debug("[choice-gen] AI 호출 시작: attempt={}/{}, questionUuid={}", attempts, MAX_ATTEMPTS, questionUuid);
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

    private GenerateChoiceSetRequest buildRequest(Question question, PromptTemplate prompt) {
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
}
