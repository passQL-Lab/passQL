package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "question_concept_tag",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_question_concept_tag", columnNames = {"question_uuid", "concept_tag_uuid"})
    },
    indexes = {
        @Index(name = "idx_qct_question", columnList = "question_uuid"),
        @Index(name = "idx_qct_tag", columnList = "concept_tag_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionConceptTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID questionConceptTagUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID questionUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID conceptTagUuid;
}
