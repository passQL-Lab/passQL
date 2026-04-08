package com.passql.question.repository;

import com.passql.question.entity.QuestionChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionChoiceRepository extends JpaRepository<QuestionChoice, UUID> {

    List<QuestionChoice> findByQuestionUuidOrderBySortOrderAsc(UUID questionUuid);

    Optional<QuestionChoice> findByQuestionUuidAndChoiceKey(UUID questionUuid, String choiceKey);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);
}
