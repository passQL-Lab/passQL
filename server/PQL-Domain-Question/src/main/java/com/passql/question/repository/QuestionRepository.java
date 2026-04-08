package com.passql.question.repository;

import com.passql.question.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    List<Question> findByIsActiveTrue();

    List<Question> findByTopicUuid(UUID topicUuid);

    Page<Question> findByIsActiveTrue(Pageable pageable);

    @Query(value = "SELECT * FROM question WHERE is_active = true ORDER BY RAND() LIMIT :size", nativeQuery = true)
    List<Question> findRandomActive(@Param("size") int size);

    @Query(value = "SELECT * FROM question WHERE is_active = true AND question_uuid <> :excludeUuid ORDER BY RAND() LIMIT :size", nativeQuery = true)
    List<Question> findRandomActiveExcluding(@Param("size") int size, @Param("excludeUuid") String excludeUuid);

    @Query("SELECT q.questionUuid FROM Question q WHERE q.isActive = true ORDER BY q.createdAt ASC")
    List<UUID> findActiveUuidsOrderedByCreatedAt();
}
