package com.passql.question.repository;

import com.passql.question.entity.QuestionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionReportRepository extends JpaRepository<QuestionReport, UUID> {

    boolean existsByMemberUuidAndSubmissionUuid(UUID memberUuid, UUID submissionUuid);

    boolean existsByQuestionUuidAndMemberUuidAndSubmissionUuid(UUID questionUuid, UUID memberUuid, UUID submissionUuid);

    List<QuestionReport> findByQuestionUuidOrderByCreatedAtDesc(UUID questionUuid);

    @Query(value = """
            SELECT question_uuid,
                   COUNT(*) AS totalCount,
                   SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
                   MAX(created_at) AS latestReportedAt
            FROM question_report
            GROUP BY question_uuid
            ORDER BY MAX(created_at) DESC
            """, nativeQuery = true)
    List<Object[]> findReportSummaryGroupByQuestion();

    /**
     * status 필터 적용 시 집계.
     *
     * pendingCount는 필터된 범위 내 PENDING 수를 의미 (전체 PENDING 수가 아님).
     * status='RESOLVED' 필터 시 pendingCount는 항상 0 — 의도된 동작.
     */
    @Query(value = """
            SELECT question_uuid,
                   COUNT(*) AS totalCount,
                   SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
                   MAX(created_at) AS latestReportedAt
            FROM question_report
            WHERE status = :status
            GROUP BY question_uuid
            ORDER BY MAX(created_at) DESC
            """, nativeQuery = true)
    List<Object[]> findReportSummaryGroupByQuestionAndStatus(@Param("status") String status);
}
