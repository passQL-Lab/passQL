package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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
     * Returns null if no active questions exist.
     */
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
        return questionRepository.findById(pick).orElse(null);
    }

    public TodayQuestionResponse getTodayResponse(boolean alreadySolved) {
        Question question = resolveTodayQuestion();
        if (question == null) {
            return new TodayQuestionResponse(null, false);
        }
        return new TodayQuestionResponse(toSummary(question), alreadySolved);
    }

    public RecommendationsResponse getRecommendations(int size, UUID excludeQuestionUuid) {
        int clamped = Math.max(1, Math.min(size, 5));
        UUID exclude = excludeQuestionUuid;
        if (exclude == null) {
            DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
            if (dc != null) {
                exclude = dc.getQuestionUuid();
            }
        }
        List<Question> list = (exclude != null)
                ? questionRepository.findRandomActiveExcluding(clamped, exclude.toString())
                : questionRepository.findRandomActive(clamped);
        return new RecommendationsResponse(list.stream().map(this::toSummary).toList());
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

    private String topicName(UUID topicUuid) {
        if (topicUuid == null) return null;
        return topicRepository.findById(topicUuid).map(Topic::getDisplayName).orElse(null);
    }

    private String subtopicName(UUID subtopicUuid) {
        if (subtopicUuid == null) return null;
        return subtopicRepository.findById(subtopicUuid).map(Subtopic::getDisplayName).orElse(null);
    }
}
