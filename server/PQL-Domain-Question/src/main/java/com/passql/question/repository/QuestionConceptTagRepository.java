package com.passql.question.repository;

import com.passql.question.entity.QuestionConceptTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
}
