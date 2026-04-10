package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.Dialect;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 관리자 문제 등록용 AI 생성 서비스.
 * <p>
 * - AI 문제 생성 (generate) → AiGatewayClient
 * - 검수 후 저장 (createQuestionWithSeedSet) → Question + ChoiceSet + Items 트랜잭션
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionGenerateService {

    private static final String PROMPT_KEY = "generate_question_full";

    private final AiGatewayClient aiGatewayClient;
    private final PromptService promptService;
    private final QuestionRepository questionRepository;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;

    /**
     * AI에게 문제를 생성 요청한다 (저장하지 않음, 관리자 preview 용).
     */
    public GenerateQuestionFullResult generate(QuestionFullContextDto context) {
        PromptTemplate prompt = promptService.getActivePrompt(PROMPT_KEY);

        Map<String, Object> responseSchema = Map.of(
                "type", "object",
                "properties", Map.of(
                        "stem", Map.of("type", "string"),
                        "answer_sql", Map.of("type", "string"),
                        "seed_choices", Map.of(
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
                "required", List.of("stem", "answer_sql", "seed_choices")
        );

        LlmConfigDto llmConfig = new LlmConfigDto(
                prompt.getModel(),
                prompt.getSystemPrompt(),
                prompt.getUserTemplate(),
                prompt.getTemperature(),
                prompt.getMaxTokens(),
                responseSchema
        );

        GenerateQuestionFullRequest req = new GenerateQuestionFullRequest(context, llmConfig);
        return aiGatewayClient.generateQuestionFull(req);
    }

    /**
     * 관리자 직접 입력으로 Question만 저장 (선택지 없음, AI가 나중에 자동 생성).
     */
    @Transactional
    public Question createQuestionOnly(
            UUID topicUuid,
            UUID subtopicUuid,
            int difficulty,
            ExecutionMode executionMode,
            String stem,
            String schemaDdl,
            String schemaSampleData,
            String schemaIntent,
            String answerSql,
            String hint,
            ChoiceSetPolicy choiceSetPolicy
    ) {
        ExecutionMode mode = executionMode != null ? executionMode : ExecutionMode.EXECUTABLE;
        if (mode == ExecutionMode.EXECUTABLE) {
            if (schemaDdl == null || schemaDdl.isBlank()) {
                throw new CustomException(ErrorCode.QUESTION_GENERATE_INPUT_INVALID);
            }
            if (answerSql == null || answerSql.isBlank()) {
                throw new CustomException(ErrorCode.QUESTION_GENERATE_INPUT_INVALID);
            }
        }

        Question question = Question.builder()
                .topicUuid(topicUuid)
                .subtopicUuid(subtopicUuid)
                .difficulty(difficulty)
                .executionMode(mode)
                .dialect(Dialect.MARIADB)
                .stem(stem)
                .schemaDdl(schemaDdl)
                .schemaSampleData(schemaSampleData)
                .schemaIntent(schemaIntent)
                .answerSql(answerSql)
                .hint(hint)
                .choiceSetPolicy(choiceSetPolicy != null ? choiceSetPolicy : ChoiceSetPolicy.AI_ONLY)
                .isActive(true)
                .build();
        question = questionRepository.saveAndFlush(question);
        log.info("[question-register] saved: questionUuid={}", question.getQuestionUuid());
        return question;
    }

    /**
     * 관리자 검수 후 저장: Question + seed ChoiceSet + Items.
     */
    @Transactional
    public Question createQuestionWithSeedSet(
            UUID topicUuid,
            UUID subtopicUuid,
            int difficulty,
            String schemaDdl,
            String schemaSampleData,
            String schemaIntent,
            String stem,
            String answerSql,
            String hint,
            ChoiceSetPolicy choiceSetPolicy,
            List<GeneratedChoiceDto> seedChoices
    ) {
        Question question = Question.builder()
                .topicUuid(topicUuid)
                .subtopicUuid(subtopicUuid)
                .difficulty(difficulty)
                .executionMode(ExecutionMode.CONCEPT_ONLY)
                .dialect(Dialect.MARIADB)
                .stem(stem)
                .schemaDdl(schemaDdl)
                .schemaSampleData(schemaSampleData)
                .schemaIntent(schemaIntent)
                .answerSql(answerSql)
                .hint(hint)
                .choiceSetPolicy(choiceSetPolicy != null ? choiceSetPolicy : ChoiceSetPolicy.AI_ONLY)
                .isActive(true)
                .build();
        question = questionRepository.saveAndFlush(question);

        // Seed ChoiceSet 저장
        QuestionChoiceSet seedSet = QuestionChoiceSet.builder()
                .questionUuid(question.getQuestionUuid())
                .source(ChoiceSetSource.ADMIN_SEED)
                .status(ChoiceSetStatus.OK)
                .generationAttempts(1)
                .sandboxValidationPassed(false) // 관리자 검수이므로 별도 sandbox 필요 없음
                .isReusable(true)
                .build();
        seedSet = choiceSetRepository.saveAndFlush(seedSet);

        for (int i = 0; i < seedChoices.size(); i++) {
            GeneratedChoiceDto c = seedChoices.get(i);
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                    .choiceSetUuid(seedSet.getChoiceSetUuid())
                    .choiceKey(c.key())
                    .sortOrder(i)
                    .kind(ChoiceKind.SQL)
                    .body(c.body())
                    .isCorrect(c.isCorrect())
                    .rationale(c.rationale())
                    .build();
            choiceSetItemRepository.save(item);
        }

        log.info("[question-gen] saved: questionUuid={}, seedSetUuid={}",
                question.getQuestionUuid(), seedSet.getChoiceSetUuid());
        return question;
    }
}
