package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "daily_challenge",
    // (challenge_date, sort_order) 복합 유니크 — 하루에 여러 문제를 순서별로 관리
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_challenge_date_order",
            columnNames = {"challenge_date", "sort_order"})
    },
    indexes = {
        @Index(name = "idx_daily_challenge_question", columnList = "question_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailyChallenge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID dailyChallengeUuid;

    @Column(nullable = false)
    private LocalDate challengeDate;

    // 하루 세트 내 문제 순서 (0-based)
    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private UUID questionUuid;
}
