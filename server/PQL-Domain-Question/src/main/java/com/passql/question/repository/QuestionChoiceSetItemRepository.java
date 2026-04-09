package com.passql.question.repository;

import com.passql.question.entity.QuestionChoiceSetItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionChoiceSetItemRepository extends JpaRepository<QuestionChoiceSetItem, UUID> {

    List<QuestionChoiceSetItem> findByChoiceSetUuidOrderBySortOrderAsc(UUID choiceSetUuid);

    Optional<QuestionChoiceSetItem> findByChoiceSetUuidAndChoiceKey(UUID choiceSetUuid, String choiceKey);
}
