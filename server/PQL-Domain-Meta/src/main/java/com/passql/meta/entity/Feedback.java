package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.meta.constant.FeedbackStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
    name = "feedback",
    indexes = {
        @Index(name = "idx_feedback_member_uuid", columnList = "member_uuid"),
        @Index(name = "idx_feedback_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Feedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID feedbackUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false, length = 500)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackStatus status;
}
