package com.passql.submission.repository;

import com.passql.submission.entity.Submission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    List<Submission> findByMemberUuidOrderBySubmittedAtDesc(UUID memberUuid);

    long countByMemberUuid(UUID memberUuid);

    long countByMemberUuidAndIsCorrectTrue(UUID memberUuid);

    @Query("SELECT COUNT(DISTINCT s.questionUuid) FROM Submission s WHERE s.memberUuid = :memberUuid")
    long countDistinctQuestionUuidByMemberUuid(@Param("memberUuid") UUID memberUuid);

    boolean existsByMemberUuidAndQuestionUuidAndSubmittedAtBetween(
            UUID memberUuid, UUID questionUuid, LocalDateTime start, LocalDateTime end);

    @Query(value = "WITH latest AS (SELECT question_uuid, is_correct, ROW_NUMBER() OVER (PARTITION BY question_uuid ORDER BY submitted_at DESC) rn FROM submission WHERE member_uuid = :memberUuid) SELECT COALESCE(AVG(CASE WHEN is_correct=1 THEN 1.0 ELSE 0.0 END),0) FROM latest WHERE rn=1", nativeQuery = true)
    Double calculateCorrectRateByMemberUuid(@Param("memberUuid") String memberUuid);

    @Query("SELECT DISTINCT FUNCTION('DATE', s.submittedAt) FROM Submission s WHERE s.memberUuid = :memberUuid ORDER BY FUNCTION('DATE', s.submittedAt) DESC")
    List<java.sql.Date> findSubmissionDatesByMemberUuid(@Param("memberUuid") UUID memberUuid);

    /**
     * 최근 시도의 isCorrect 플래그 리스트 (submittedAt DESC).
     * ReadinessCalculator의 Accuracy 계산 입력.
     * 호출부에서 PageRequest.of(0, RECENT_ATTEMPT_WINDOW)로 상위 N개만 조회한다.
     */
    @Query("SELECT s.isCorrect FROM Submission s " +
           "WHERE s.memberUuid = :memberUuid " +
           "ORDER BY s.submittedAt DESC")
    List<Boolean> findRecentCorrectFlagsByMemberUuid(
        @Param("memberUuid") UUID memberUuid,
        Pageable pageable
    );

    /**
     * 최근 :since 이후에 제출된 문제들 중 "활성 토픽"의 distinct 개수.
     * Submission에는 topicUuid가 없으므로 Question과 join하여 topicUuid를 얻고,
     * Topic.isActive=true인 것만 센다.
     * ReadinessCalculator의 Coverage 분자.
     */
    @Query("SELECT COUNT(DISTINCT q.topicUuid) " +
           "FROM Submission s, com.passql.question.entity.Question q, com.passql.meta.entity.Topic t " +
           "WHERE s.questionUuid = q.questionUuid " +
           "  AND q.topicUuid = t.topicUuid " +
           "  AND s.memberUuid = :memberUuid " +
           "  AND s.submittedAt >= :since " +
           "  AND t.isActive = true")
    long countDistinctRecentActiveTopicsByMemberUuid(
        @Param("memberUuid") UUID memberUuid,
        @Param("since") LocalDateTime since
    );

    /**
     * 사용자의 가장 최근 제출 시각. 미제출 시 null.
     * Recency 계산 + lastStudiedAt 응답 필드.
     */
    @Query("SELECT MAX(s.submittedAt) FROM Submission s WHERE s.memberUuid = :memberUuid")
    LocalDateTime findLastSubmittedAtByMemberUuid(@Param("memberUuid") UUID memberUuid);
}
