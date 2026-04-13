package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
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
import com.passql.question.entity.QuestionConceptTag;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionConceptTagRepository;
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
    private final QuestionConceptTagRepository questionConceptTagRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;

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
                .dialect(Dialect.POSTGRESQL)
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

        // Qdrant 임베딩 적재 (비동기적으로 실패해도 문제 등록 흐름에 영향 없음)
        indexQuestionAsync(question);

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
                .dialect(Dialect.POSTGRESQL)
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

        // Qdrant 임베딩 적재 (비동기적으로 실패해도 문제 등록 흐름에 영향 없음)
        indexQuestionAsync(question);

        return question;
    }

    /**
     * 활성 문제 전체를 Qdrant에 재색인한다 (관리자 "전체 색인" 버튼용).
     * 타임아웃 문제를 방지하기 위해 1개씩 순차 전송한다.
     */
    @Transactional(readOnly = true)
    public IndexQuestionsBulkResult reindexAll() {
        List<Question> questions = questionRepository.findByIsActiveTrue();
        log.info("[reindex-all] 전체 재색인 시작: 활성 문제 수={}", questions.size());

        List<IndexQuestionRequest> requests = questions.stream()
                .map(q -> buildIndexRequest(q))
                .toList();

        return indexOneByOne(requests, "reindex-all");
    }

    /**
     * 선택한 문제 UUID 목록을 Qdrant에 재색인한다 (관리자 "선택 색인" 버튼용).
     * 타임아웃 문제를 방지하기 위해 1개씩 순차 전송한다.
     * 존재하지 않는 UUID는 조용히 스킵한다.
     */
    @Transactional(readOnly = true)
    public IndexQuestionsBulkResult reindexSelected(List<String> questionUuids) {
        log.info("[reindex-selected] 선택 재색인 시작: 요청 수={}", questionUuids.size());

        List<IndexQuestionRequest> requests = questionUuids.stream()
                .map(uuidStr -> questionRepository.findById(UUID.fromString(uuidStr)).orElse(null))
                .filter(q -> q != null)
                .map(q -> buildIndexRequest(q))
                .toList();

        log.info("[reindex-selected] 실제 처리할 문제 수={}", requests.size());
        return indexOneByOne(requests, "reindex-selected");
    }

    /**
     * IndexQuestionRequest 목록을 1개씩 순차 전송하여 결과를 집계한다.
     * bulk 전송 시 타임아웃이 발생하는 경우를 방지한다.
     */
    private IndexQuestionsBulkResult indexOneByOne(List<IndexQuestionRequest> requests, String logPrefix) {
        int succeeded = 0;
        int failed = 0;
        List<String> failedUuids = new java.util.ArrayList<>();

        int total = requests.size();
        for (int i = 0; i < total; i++) {
            IndexQuestionRequest req = requests.get(i);
            try {
                var result = aiGatewayClient.indexQuestion(req);
                if (result != null) {
                    succeeded++;
                } else {
                    failed++;
                    failedUuids.add(req.questionUuid());
                    log.warn("[{}] 색인 결과 null: uuid={}", logPrefix, req.questionUuid());
                }
            } catch (Exception e) {
                failed++;
                failedUuids.add(req.questionUuid());
                log.warn("[{}] 색인 실패: uuid={}, error={}", logPrefix, req.questionUuid(), e.getMessage());
            }
            // 매 문제마다 진행 상황 로그
            log.info("[{}] 진행: {}/{} (성공={}, 실패={})", logPrefix, i + 1, total, succeeded, failed);
        }

        log.info("[{}] 완료: total={}, succeeded={}, failed={}", logPrefix, requests.size(), succeeded, failed);
        return new IndexQuestionsBulkResult(requests.size(), succeeded, failed, failedUuids);
    }

    /**
     * Question 엔티티 → IndexQuestionRequest 변환.
     * 토픽/서브토픽 이름과 태그 키 조회를 포함한다.
     */
    private IndexQuestionRequest buildIndexRequest(Question question) {
        String topicName = topicRepository.findById(question.getTopicUuid())
                .map(Topic::getDisplayName)
                .orElse("");
        String subtopicName = question.getSubtopicUuid() != null
                ? subtopicRepository.findById(question.getSubtopicUuid())
                        .map(Subtopic::getDisplayName)
                        .orElse(null)
                : null;
        List<String> tagKeys = questionConceptTagRepository
                .findTagKeysByQuestionUuid(question.getQuestionUuid().toString());

        return new IndexQuestionRequest(
                question.getQuestionUuid().toString(),
                topicName,
                subtopicName,
                question.getDifficulty(),
                tagKeys,
                question.getStem() != null ? question.getStem() : ""
        );
    }

    /**
     * 문제를 Qdrant에 임베딩 적재한다.
     * VirtualThread로 실행하여 문제 등록 응답 속도에 영향을 주지 않는다.
     */
    private void indexQuestionAsync(Question question) {
        Thread.startVirtualThread(() -> {
            try {
                // 토픽/서브토픽 이름 조회
                String topicName = topicRepository.findById(question.getTopicUuid())
                        .map(Topic::getDisplayName)
                        .orElse("");
                String subtopicName = question.getSubtopicUuid() != null
                        ? subtopicRepository.findById(question.getSubtopicUuid())
                                .map(Subtopic::getDisplayName)
                                .orElse(null)
                        : null;

                // 개념 태그 키 목록 조회 — JOIN 쿼리로 N+1 방지
                List<String> tagKeys = questionConceptTagRepository
                        .findTagKeysByQuestionUuid(question.getQuestionUuid().toString());

                IndexQuestionRequest req = new IndexQuestionRequest(
                        question.getQuestionUuid().toString(),
                        topicName,
                        subtopicName,
                        question.getDifficulty(),
                        tagKeys,
                        question.getStem() != null ? question.getStem() : ""
                );

                IndexQuestionResult result = aiGatewayClient.indexQuestion(req);
                if (result != null) {
                    log.info("[question-index] Qdrant 적재 완료: questionUuid={}, created={}",
                            question.getQuestionUuid(), result.created());
                }
            } catch (Exception e) {
                // 인덱싱 실패는 문제 등록 완료에 영향을 주지 않음
                log.warn("[question-index] Qdrant 적재 실패 (non-critical): questionUuid={}, error={}",
                        question.getQuestionUuid(), e.getMessage());
            }
        });
    }
}
