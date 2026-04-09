package com.passql.question.repository;

import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.entity.QuestionChoiceSet;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
