package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.QuizSessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 퀴즈 세션. 세션 시작 시 10문제 순서를 고정 (question_order_json) 하고
 * 사용자가 진행하는 동안 current_index 를 갱신한다.
 */
@Entity
@Table(
    name = "quiz_session",
    indexes = {
        @Index(name = "idx_quiz_session_member", columnList = "member_uuid"),
        @Index(name = "idx_quiz_session_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuizSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID sessionUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID memberUuid;

    /** JSON 배열: ["questionUuid1", ..., "questionUuid10"] */
    @Column(columnDefinition = "JSON", nullable = false)
    private String questionOrderJson;

    @Column(nullable = false)
    @Builder.Default
    private Integer currentIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalQuestions = 10;

    @Column(columnDefinition = "CHAR(36)")
    private UUID topicUuid;

    private Integer difficultyMin;

    private Integer difficultyMax;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private QuizSessionStatus status = QuizSessionStatus.IN_PROGRESS;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;
}
