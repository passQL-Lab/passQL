package com.passql.question.repository;

import com.passql.question.constant.ExecutionMode;
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

    /** 대시보드 집계용 — 전체 활성 문제 수 count 쿼리 */
    long countByIsActiveTrue();

    List<Question> findByTopicUuid(UUID topicUuid);

    Page<Question> findByIsActiveTrue(Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.isActive = true" +
           " AND (:topicUuid IS NULL OR q.topicUuid = :topicUuid)" +
           " AND (:difficulty IS NULL OR q.difficulty = :difficulty)" +
           " AND (:executionMode IS NULL OR q.executionMode = :executionMode)")
    Page<Question> findByFilters(
            @Param("topicUuid") UUID topicUuid,
            @Param("difficulty") Integer difficulty,
            @Param("executionMode") ExecutionMode executionMode,
            Pageable pageable
    );

    @Query("SELECT q FROM Question q WHERE q.isActive = true" +
           " AND (:topicUuid IS NULL OR q.topicUuid = :topicUuid)" +
           " AND (:difficulty IS NULL OR q.difficulty = :difficulty)" +
           " AND (:executionMode IS NULL OR q.executionMode = :executionMode)" +
           " ORDER BY q.createdAt DESC")
    List<Question> findByFiltersAll(
            @Param("topicUuid") UUID topicUuid,
            @Param("difficulty") Integer difficulty,
            @Param("executionMode") ExecutionMode executionMode,
            Pageable pageable
    );

    // PostgreSQL: RAND() 대신 RANDOM() 사용
    @Query(value = "SELECT * FROM question WHERE is_active = true ORDER BY RANDOM() LIMIT :size", nativeQuery = true)
    List<Question> findRandomActive(@Param("size") int size);

    // PostgreSQL: CAST(:param AS uuid) 사용 (::uuid는 Hibernate 파라미터 파싱 오류 유발)
    @Query(value = "SELECT * FROM question WHERE is_active = true AND question_uuid <> CAST(:excludeUuid AS uuid) ORDER BY RANDOM() LIMIT :size", nativeQuery = true)
    List<Question> findRandomActiveExcluding(@Param("size") int size, @Param("excludeUuid") String excludeUuid);

    @Query("SELECT q.questionUuid FROM Question q WHERE q.isActive = true ORDER BY q.createdAt ASC")
    List<UUID> findActiveUuidsOrderedByCreatedAt();

    @Query("SELECT q.questionUuid FROM Question q WHERE q.isActive = true AND q.choiceSetPolicy = com.passql.question.constant.ChoiceSetPolicy.AI_ONLY")
    List<UUID> findActiveAiOnlyUuids();

    @Query(value = "SELECT q.topic_uuid, COUNT(*) FROM question q WHERE q.is_active = true GROUP BY q.topic_uuid", nativeQuery = true)
    List<Object[]> countActiveByTopic();
}
