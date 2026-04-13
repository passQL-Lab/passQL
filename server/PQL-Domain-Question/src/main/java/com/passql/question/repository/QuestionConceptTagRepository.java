package com.passql.question.repository;

import com.passql.question.entity.QuestionConceptTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface QuestionConceptTagRepository extends JpaRepository<QuestionConceptTag, UUID> {

    List<QuestionConceptTag> findByQuestionUuid(UUID questionUuid);

    List<QuestionConceptTag> findByConceptTagUuid(UUID conceptTagUuid);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);

    boolean existsByQuestionUuidAndConceptTagUuid(UUID questionUuid, UUID conceptTagUuid);

    /**
     * 문제에 연결된 개념 태그 키 목록을 단일 쿼리로 조회 (N+1 방지).
     * QuestionGenerateService의 indexQuestionAsync에서 사용.
     */
    @Query(value =
        "SELECT ct.tag_key " +
        "FROM question_concept_tag qct " +
        "JOIN concept_tag ct ON qct.concept_tag_uuid = ct.concept_tag_uuid " +
        "WHERE qct.question_uuid = CAST(:questionUuid AS uuid) " +
        "  AND ct.is_active = true",
        nativeQuery = true)
    List<String> findTagKeysByQuestionUuid(@Param("questionUuid") String questionUuid);
}
