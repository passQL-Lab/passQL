package com.passql.question.repository;

import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.entity.QuestionChoiceSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionChoiceSetRepository extends JpaRepository<QuestionChoiceSet, UUID> {

    /**
     * 프리페치 캐시 조회: 특정 멤버·특정 문제에 대해 아직 소비되지 않은
     * AI_PREFETCH + status=OK 세트 중 가장 최근 것.
     */
    Optional<QuestionChoiceSet>
        findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
            UUID questionUuid, UUID generatedForMemberUuid,
            ChoiceSetSource source, ChoiceSetStatus status);

    boolean existsByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNull(
            UUID questionUuid, UUID generatedForMemberUuid,
            ChoiceSetSource source, ChoiceSetStatus status);

    List<QuestionChoiceSet> findByQuestionUuidAndSourceOrderByCreatedAtDesc(UUID questionUuid, ChoiceSetSource source);

    List<QuestionChoiceSet> findByQuestionUuidOrderByCreatedAtDesc(UUID questionUuid);

    /**
     * 연습 모드 재사용 조회: 특정 문제에 대해 status=OK인 선택지 중 가장 최근 것.
     * generatedForMemberUuid 무관 — 다른 사용자가 생성한 것도 재사용 가능.
     */
    Optional<QuestionChoiceSet>
        findFirstByQuestionUuidAndStatusOrderByCreatedAtDesc(
            UUID questionUuid, ChoiceSetStatus status);

    /** 프리페치 소비 마킹 — 별도 @Transactional 빈 없이 Repository 레벨에서 직접 처리. */
    @Modifying
    @Transactional
    @Query("UPDATE QuestionChoiceSet q SET q.consumedAt = :consumedAt WHERE q.choiceSetUuid = :choiceSetUuid")
    void markConsumed(UUID choiceSetUuid, LocalDateTime consumedAt);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);
}
