package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.dto.TodayQuestionResponse;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoice;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final DailyChallengeRepository dailyChallengeRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;

    public Page<QuestionSummary> getQuestions(String topicCode, String subtopic, Integer difficulty, String mode, Pageable pageable) {
        UUID topicUuid = (topicCode != null && !topicCode.isBlank())
                ? topicRepository.findByCode(topicCode).map(Topic::getTopicUuid).orElse(null)
                : null;
        ExecutionMode executionMode = (mode != null && !mode.isBlank())
                ? ExecutionMode.valueOf(mode)
                : null;
        return questionRepository.findByFilters(topicUuid, difficulty, executionMode, pageable).map(this::toSummary);
    }

    public QuestionDetail getQuestion(UUID questionUuid) {
        Question q = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        List<QuestionDetail.ChoiceSetSummary> choiceSets = choiceSetRepository
                .findByQuestionUuidOrderByCreatedAtDesc(questionUuid)
                .stream()
                .map(set -> {
                    List<QuestionDetail.ChoiceItem> items = choiceSetItemRepository
                            .findByChoiceSetUuidOrderBySortOrderAsc(set.getChoiceSetUuid())
                            .stream()
                            .map(c -> new QuestionDetail.ChoiceItem(
                                    c.getChoiceKey(), c.getKind(), c.getBody(),
                                    c.getIsCorrect(), c.getRationale(), c.getSortOrder()))
                            .toList();
                    return new QuestionDetail.ChoiceSetSummary(
                            set.getChoiceSetUuid(),
                            set.getSource(),
                            set.getStatus(),
                            set.getSandboxValidationPassed(),
                            set.getCreatedAt(),
                            items);
                })
                .toList();

        return new QuestionDetail(
                q.getQuestionUuid(),
                topicName(q.getTopicUuid()),
                subtopicName(q.getSubtopicUuid()),
                q.getDifficulty(),
                q.getExecutionMode(),
                q.getChoiceSetPolicy(),
                q.getStem(),
                q.getSchemaDisplay(),
                q.getSchemaDdl(),
                q.getSchemaSampleData(),
                q.getSchemaIntent(),
                q.getAnswerSql(),
                q.getHint(),
                choiceSets
        );
    }

    public Question getQuestionEntity(UUID questionUuid) {
        return questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
    }

    /**
     * Resolve today's question (from DailyChallenge or deterministic fallback).
     * 폴백으로 선택된 경우 daily_challenge 테이블에 즉시 저장한다 (스케줄러 실패 백업).
     * REQUIRES_NEW: 호출자가 readOnly 트랜잭션을 열고 있어도 독립적인 쓰기 트랜잭션으로 처리한다.
     * Returns null if no active questions exist.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Question resolveTodayQuestion() {
        DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
        if (dc != null) {
            return questionRepository.findById(dc.getQuestionUuid()).orElse(null);
        }

        List<UUID> active = questionRepository.findActiveUuidsOrderedByCreatedAt();
        if (active.isEmpty()) {
            return null;
        }

        long seed = LocalDate.now().toEpochDay();
        UUID pick = active.get((int) Math.floorMod(seed, active.size()));

        try {
            // saveAndFlush: 트랜잭션 커밋 전에 즉시 flush하여 UNIQUE 위반을 여기서 감지
            dailyChallengeRepository.saveAndFlush(
                    DailyChallenge.builder()
                            .challengeDate(LocalDate.now())
                            .questionUuid(pick)
                            .build()
            );
        } catch (DataIntegrityViolationException ignored) {
            // 동시 요청으로 다른 스레드가 먼저 저장 완료 — 결정론적 알고리즘이므로 동일한 pick 사용
        }

        return questionRepository.findById(pick).orElse(null);
    }

    public TodayQuestionResponse getTodayResponse(boolean alreadySolved) {
        Question question = resolveTodayQuestion();
        if (question == null) {
            return new TodayQuestionResponse(null, false);
        }
        return new TodayQuestionResponse(toSummary(question), alreadySolved);
    }

    /**
     * RANDOM 기반 추천.
     * memberUuid 없거나 AI 추천 실패 시 호출되는 fallback.
     */
    public RecommendationsResponse getRecommendations(int size, List<UUID> excludeQuestionUuids) {
        int clamped = Math.max(1, Math.min(size, 5));

        // 오늘의 문제도 제외 목록에 추가
        List<String> excludeList = new ArrayList<>(
                excludeQuestionUuids != null
                        ? excludeQuestionUuids.stream().map(UUID::toString).toList()
                        : List.of()
        );
        DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
        if (dc != null) {
            excludeList.add(dc.getQuestionUuid().toString());
        }

        List<Question> list = excludeList.isEmpty()
                ? questionRepository.findRandomActive(clamped)
                : questionRepository.findRandomActiveExcludingList(clamped, excludeList);
        return new RecommendationsResponse(list.stream().map(this::toSummary).toList());
    }

    /**
     * AI 추천 결과(questionUuid 목록)를 받아 QuestionSummary 목록으로 변환.
     * Application 레이어의 RecommendationService에서 호출한다.
     */
    public RecommendationsResponse getRecommendationsByUuids(List<String> questionUuids) {
        List<Question> questions = questionUuids.stream()
                .map(uuidStr -> {
                    try {
                        return questionRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(q -> q != null && Boolean.TRUE.equals(q.getIsActive()))
                .toList();
        return new RecommendationsResponse(questions.stream().map(this::toSummary).toList());
    }

    public QuestionSummary toSummary(Question q) {
        String stem = q.getStem();
        String preview = stem == null ? "" : (stem.length() > 100 ? stem.substring(0, 100) : stem);
        Topic topic = q.getTopicUuid() != null ? topicRepository.findById(q.getTopicUuid()).orElse(null) : null;
        return new QuestionSummary(
                q.getQuestionUuid(),
                topic != null ? topic.getCode() : null,
                topic != null ? topic.getDisplayName() : null,
                q.getDifficulty(),
                q.getExecutionMode(),
                preview,
                q.getCreatedAt()
        );
    }

    @Transactional
    public void updateQuestion(UUID questionUuid, String stem, String schemaDisplay, String schemaDdl,
                               String schemaSampleData, String schemaIntent, String answerSql, String hint,
                               Integer difficulty, ExecutionMode executionMode,
                               UUID topicUuid, UUID subtopicUuid) {
        Question q = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
        q.setStem(stem);
        q.setSchemaDisplay(schemaDisplay);
        q.setSchemaDdl(schemaDdl);
        q.setSchemaSampleData(schemaSampleData);
        q.setSchemaIntent(schemaIntent);
        q.setAnswerSql(answerSql);
        q.setHint(hint);
        q.setDifficulty(difficulty);
        q.setExecutionMode(executionMode);
        q.setTopicUuid(topicUuid);
        q.setSubtopicUuid(subtopicUuid);
    }

    @Transactional
    public void updateChoiceSetPolicy(UUID questionUuid, ChoiceSetPolicy policy) {
        Question q = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
        q.setChoiceSetPolicy(policy);
    }

    /**
     * 임베딩 색인 상태 확인을 위해 활성 문제 전체 UUID를 문자열 목록으로 반환.
     * AdminEmbeddingController에서 AiGatewayClient.getIndexStatus() 호출 전 사용한다.
     */
    public List<String> getAllActiveQuestionUuids() {
        List<String> uuids = questionRepository.findAllActiveQuestionUuids();
        log.debug("[embedding-status] 활성 문제 UUID 조회 완료: count={}", uuids.size());
        return uuids;
    }

    private String topicName(UUID topicUuid) {
        if (topicUuid == null) return null;
        return topicRepository.findById(topicUuid).map(Topic::getDisplayName).orElse(null);
    }

    private String subtopicName(UUID subtopicUuid) {
        if (subtopicUuid == null) return null;
        return subtopicRepository.findById(subtopicUuid).map(Subtopic::getDisplayName).orElse(null);
    }
}
