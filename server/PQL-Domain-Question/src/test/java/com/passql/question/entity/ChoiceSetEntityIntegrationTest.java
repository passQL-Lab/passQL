package com.passql.question.entity;

import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.Dialect;
import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.web.PassqlApplication;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sub-plan 1 데이터 계층 통합 테스트.
 * Flyway V0_0_28 적용 후 스키마·Entity·Repository 파생 쿼리·FK·UNIQUE 제약을 검증한다.
 */
@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Transactional
@Slf4j
class ChoiceSetEntityIntegrationTest {

    @Autowired QuestionRepository questionRepository;
    @Autowired QuestionChoiceSetRepository choiceSetRepository;
    @Autowired QuestionChoiceSetItemRepository choiceSetItemRepository;
    @Autowired QuizSessionRepository quizSessionRepository;
    @Autowired EntityManager em;

    @Test
    void question_새_컬럼이_기본값으로_저장되고_조회된다() {
        Question q = buildMinimalQuestion();
        q.setAnswerSql("SELECT 1");
        q.setSchemaSampleData("INSERT INTO t VALUES (1);");
        q.setSchemaIntent("단일 행 조회");
        q.setHint("WHERE 절 없음");

        Question saved = questionRepository.saveAndFlush(q);
        em.clear();

        Question reloaded = questionRepository.findById(saved.getQuestionUuid()).orElseThrow();
        assertThat(reloaded.getAnswerSql()).isEqualTo("SELECT 1");
        assertThat(reloaded.getSchemaSampleData()).isEqualTo("INSERT INTO t VALUES (1);");
        assertThat(reloaded.getSchemaIntent()).isEqualTo("단일 행 조회");
        assertThat(reloaded.getHint()).isEqualTo("WHERE 절 없음");
        assertThat(reloaded.getChoiceSetPolicy()).isEqualTo(ChoiceSetPolicy.AI_ONLY);
    }

    @Test
    void choiceSet_과_items_를_저장하고_조회한다() {
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());

        QuestionChoiceSet set = QuestionChoiceSet.builder()
            .questionUuid(q.getQuestionUuid())
            .source(ChoiceSetSource.AI_RUNTIME)
            .status(ChoiceSetStatus.OK)
            .generationAttempts(1)
            .sandboxValidationPassed(true)
            .isReusable(false)
            .modelName("gemini-2.5-flash-lite")
            .temperature(0.9f)
            .maxTokens(1536)
            .totalElapsedMs(1234)
            .build();
        QuestionChoiceSet savedSet = choiceSetRepository.saveAndFlush(set);

        for (int i = 0; i < 4; i++) {
            String key = String.valueOf((char)('A' + i));
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                .choiceSetUuid(savedSet.getChoiceSetUuid())
                .choiceKey(key)
                .sortOrder(i)
                .kind(ChoiceKind.SQL)
                .body("SELECT " + (i + 1))
                .isCorrect(i == 0)
                .rationale("설명 " + key)
                .build();
            choiceSetItemRepository.saveAndFlush(item);
        }
        em.clear();

        List<QuestionChoiceSetItem> items =
            choiceSetItemRepository.findByChoiceSetUuidOrderBySortOrderAsc(savedSet.getChoiceSetUuid());
        assertThat(items).hasSize(4);
        assertThat(items).extracting(QuestionChoiceSetItem::getChoiceKey)
            .containsExactly("A", "B", "C", "D");
        assertThat(items.get(0).getIsCorrect()).isTrue();
        assertThat(items.get(1).getIsCorrect()).isFalse();

        Optional<QuestionChoiceSetItem> itemA =
            choiceSetItemRepository.findByChoiceSetUuidAndChoiceKey(savedSet.getChoiceSetUuid(), "A");
        assertThat(itemA).isPresent();
        assertThat(itemA.get().getBody()).isEqualTo("SELECT 1");
    }

    @Test
    void prefetch_캐시_파생쿼리가_동작한다() {
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());
        UUID memberUuid = UUID.randomUUID();

        QuestionChoiceSet prefetch = QuestionChoiceSet.builder()
            .questionUuid(q.getQuestionUuid())
            .source(ChoiceSetSource.AI_PREFETCH)
            .status(ChoiceSetStatus.OK)
            .generatedForMemberUuid(memberUuid)
            .generationAttempts(1)
            .sandboxValidationPassed(true)
            .isReusable(false)
            .build();
        choiceSetRepository.saveAndFlush(prefetch);
        em.clear();

        boolean exists = choiceSetRepository
            .existsByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNull(
                q.getQuestionUuid(), memberUuid,
                ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        assertThat(exists).isTrue();

        Optional<QuestionChoiceSet> found = choiceSetRepository
            .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                q.getQuestionUuid(), memberUuid,
                ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        assertThat(found).isPresent();
        assertThat(found.get().getSource()).isEqualTo(ChoiceSetSource.AI_PREFETCH);
    }

    @Test
    void quizSession_저장과_조회() {
        UUID memberUuid = UUID.randomUUID();
        QuizSession session = QuizSession.builder()
            .memberUuid(memberUuid)
            .questionOrderJson("[\"" + UUID.randomUUID() + "\"]")
            .totalQuestions(1)
            .currentIndex(0)
            .status(QuizSessionStatus.IN_PROGRESS)
            .startedAt(LocalDateTime.now())
            .build();

        QuizSession saved = quizSessionRepository.saveAndFlush(session);
        em.clear();

        QuizSession reloaded = quizSessionRepository.findById(saved.getSessionUuid()).orElseThrow();
        assertThat(reloaded.getMemberUuid()).isEqualTo(memberUuid);
        assertThat(reloaded.getStatus()).isEqualTo(QuizSessionStatus.IN_PROGRESS);
        assertThat(reloaded.getCurrentIndex()).isZero();
        assertThat(reloaded.getQuestionOrderJson()).startsWith("[");
    }

    @Test
    void choiceSetItem_중복키_제약_위반은_예외를_던진다() {
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());
        QuestionChoiceSet set = choiceSetRepository.saveAndFlush(
            QuestionChoiceSet.builder()
                .questionUuid(q.getQuestionUuid())
                .source(ChoiceSetSource.AI_RUNTIME)
                .status(ChoiceSetStatus.OK)
                .generationAttempts(1)
                .sandboxValidationPassed(false)
                .isReusable(false)
                .build()
        );

        choiceSetItemRepository.saveAndFlush(
            QuestionChoiceSetItem.builder()
                .choiceSetUuid(set.getChoiceSetUuid())
                .choiceKey("A").sortOrder(0).kind(ChoiceKind.SQL)
                .body("SELECT 1").isCorrect(true).build()
        );

        Throwable thrown = null;
        try {
            choiceSetItemRepository.saveAndFlush(
                QuestionChoiceSetItem.builder()
                    .choiceSetUuid(set.getChoiceSetUuid())
                    .choiceKey("A").sortOrder(1).kind(ChoiceKind.SQL)
                    .body("SELECT 2").isCorrect(false).build()
            );
        } catch (Exception e) {
            thrown = e;
        }
        assertThat(thrown).isNotNull();
        log.info("기대한 UNIQUE 제약 예외 발생: {}", thrown.getClass().getSimpleName());
    }

    // --- helper ---

    private Question buildMinimalQuestion() {
        return Question.builder()
            .topicUuid(findAnyTopicUuid())
            .difficulty(3)
            .dialect(Dialect.MARIADB)
            .stem("테스트 문제")
            .schemaDdl("CREATE TABLE t (id INT);")
            .schemaSampleData("INSERT INTO t VALUES (1);")
            .answerSql("SELECT id FROM t;")
            .choiceSetPolicy(ChoiceSetPolicy.AI_ONLY)
            .isActive(true)
            .build();
    }

    /** V0_0_22 시드로 topic 이 9개 들어있음. 아무 하나 집어오기. */
    private UUID findAnyTopicUuid() {
        Object raw = em.createNativeQuery("SELECT topic_uuid FROM topic LIMIT 1")
            .getSingleResult();
        return UUID.fromString(raw.toString());
    }
}
