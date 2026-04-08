package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.ChoiceKind;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "question_choice",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_question_choice", columnNames = {"question_uuid", "choice_key"})
    },
    indexes = {
        @Index(name = "idx_question_choice_question", columnList = "question_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionChoice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID questionChoiceUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID questionUuid;

    @Column(length = 8, nullable = false)
    private String choiceKey;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ChoiceKind kind;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private Boolean isCorrect = false;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    private Integer sortOrder;
}
