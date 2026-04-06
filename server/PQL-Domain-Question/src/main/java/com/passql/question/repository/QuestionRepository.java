package com.passql.question.repository;

import com.passql.question.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Page<Question> findByTopicCode(String topicCode, Pageable pageable);
    Page<Question> findByTopicCodeAndDifficulty(String topicCode, Integer difficulty, Pageable pageable);
    List<Question> findByIdIn(List<Long> ids);
}
