package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "daily_set_submission",
    // 회원당 날짜별 제출은 1건만 허용
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_set_submission_member_date",
            columnNames = {"member_uuid", "challenge_date"})
    },
    indexes = {
        // 날짜별 점수 내림차순 조회 최적화 (랭킹/통계용)
        @Index(name = "idx_daily_set_submission_date_score",
            columnList = "challenge_date, correct_count")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailySetSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID dailySetSubmissionUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private LocalDate challengeDate;

    @Column(nullable = false)
    private Integer correctCount;

    // 세트 마지막 문제 제출 완료 시각
    @Column(nullable = false)
    private LocalDateTime completedAt;
}
