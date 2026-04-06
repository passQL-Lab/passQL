package com.passql.question.repository;

import com.passql.question.entity.QuestionChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionChoiceRepository extends JpaRepository<QuestionChoice, Long> {
    List<QuestionChoice> findByQuestionIdOrderBySortOrder(Long questionId);
}
