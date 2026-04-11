package com.passql.submission.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 문제 제출 이력 Entity.
 */
@Entity
@Table(
    name = "submission",
    indexes = {
        @Index(name = "idx_submission_member", columnList = "member_uuid"),
        @Index(name = "idx_submission_member_submitted", columnList = "member_uuid, submitted_at"),
        @Index(name = "idx_submission_member_question", columnList = "member_uuid, question_uuid"),
        @Index(name = "idx_submission_question", columnList = "question_uuid"),
        @Index(name = "idx_submission_session", columnList = "session_uuid"),
        @Index(name = "idx_submission_choice_set", columnList = "choice_set_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Submission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID submissionUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private UUID questionUuid;

    
    private UUID choiceSetUuid;

    
    private UUID sessionUuid;

    @Column
    private Integer questionIndex;

    @Column(nullable = false, length = 8)
    private String selectedChoiceKey;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private LocalDateTime submittedAt;
}
