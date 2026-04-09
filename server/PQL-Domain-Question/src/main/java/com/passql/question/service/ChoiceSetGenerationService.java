package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.dto.ValidationReport;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AI 선택지 세트 생성 + 샌드박스 검증 재시도 루프.
 * <p>
 * 비트랜잭션 — AI·샌드박스 호출이 수 초 걸리므로 긴 트랜잭션 금지.
 * save만 짧은 트랜잭션(@Transactional).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChoiceSetGenerationService {

    private static final int MAX_ATTEMPTS = 3;
    private static final String PROMPT_KEY = "generate_choice_set";

    private final QuestionService questionService;
    private final PromptService promptService;
    private final AiGatewayClient aiGatewayClient;
    private final SandboxValidator sandboxValidator;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;

    /**
     * 선택지 세트를 AI로 생성하고 샌드박스로 검증한다.
     * 최대 3회 재시도 후 실패 시 CustomException을 던진다.
     */
    public QuestionChoiceSet generate(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
        Question question = questionService.getQuestionEntity(questionUuid);
        PromptTemplate prompt = promptService.getActivePrompt(PROMPT_KEY);
        GenerateChoiceSetRequest req = buildRequest(question, prompt);

        ValidationReport lastReport = null;
        GenerateChoiceSetResult lastResult = null;
        ErrorCode lastErrorCode = null;

        for (int attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
            try {
                lastResult = aiGatewayClient.generateChoiceSet(req);
                lastReport = sandboxValidator.validate(
                        lastResult.choices(),
                        question.getAnswerSql(),
                        question.getSchemaDdl(),
                        question.getSchemaSampleData());

                if (lastReport.correctCount() == 1) {
                    return saveSuccess(question, source, memberUuid, prompt,
                            lastResult, lastReport, attempts);
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
                    saveFailed(question, source, memberUuid, prompt, lastResult, attempts, ec);
                    throw e;
                }
                // 재시도 가능 에러 (파싱 실패, 스키마 위반 등)
                lastErrorCode = ec;
                log.warn("[choice-gen] transient error, retrying: code={}, attempt={}/{}",
                        ec, attempts, e);
            }
        }

        // 3회 다 실패
        saveFailed(question, source, memberUuid, prompt, lastResult, MAX_ATTEMPTS, lastErrorCode);
        throw new CustomException(
                lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
                "questionUuid=" + questionUuid + ", source=" + source);
    }

    @Transactional
    protected QuestionChoiceSet saveSuccess(
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
                .sandboxValidationPassed(true)
                .isReusable(false)
                .totalElapsedMs(result.metadata() != null ? result.metadata().elapsedMs() : 0)
                .build();
        set = choiceSetRepository.saveAndFlush(set);

        List<GeneratedChoiceDto> choices = result.choices();
        for (int i = 0; i < choices.size(); i++) {
            GeneratedChoiceDto c = choices.get(i);
            // 샌드박스 결과 기반 is_correct 덮어쓰기
            boolean correct = report.items().get(i).matchesExpected();
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                    .choiceSetUuid(set.getChoiceSetUuid())
                    .choiceKey(c.key())
                    .sortOrder(i)
                    .kind(ChoiceKind.SQL)
                    .body(c.body())
                    .isCorrect(correct)
                    .rationale(c.rationale())
                    .build();
            choiceSetItemRepository.save(item);
        }

        log.info("[choice-gen] success: questionUuid={}, attempts={}, setUuid={}",
                question.getQuestionUuid(), attempts, set.getChoiceSetUuid());
        return set;
    }

    @Transactional
    protected void saveFailed(
            Question question, ChoiceSetSource source, UUID memberUuid,
            PromptTemplate prompt, GenerateChoiceSetResult result,
            int attempts, ErrorCode errorCode) {

        QuestionChoiceSet set = QuestionChoiceSet.builder()
                .questionUuid(question.getQuestionUuid())
                .source(source)
                .status(ChoiceSetStatus.FAILED)
                .generatedForMemberUuid(memberUuid)
                .promptTemplateUuid(prompt.getPromptTemplateUuid())
                .modelName(prompt.getModel())
                .temperature(prompt.getTemperature())
                .maxTokens(prompt.getMaxTokens())
                .generationAttempts(attempts)
                .sandboxValidationPassed(false)
                .isReusable(false)
                .build();
        choiceSetRepository.save(set);

        log.warn("[choice-gen] failed: questionUuid={}, attempts={}, errorCode={}",
                question.getQuestionUuid(), attempts, errorCode);
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
