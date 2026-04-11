package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "daily_challenge",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_challenge_date", columnNames = "challenge_date")
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

    @Column(nullable = false)
    private UUID questionUuid;
}
