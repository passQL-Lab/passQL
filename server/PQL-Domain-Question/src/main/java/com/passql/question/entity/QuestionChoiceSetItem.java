package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.ChoiceKind;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * QuestionChoiceSet 내 개별 선택지 (A~D).
 * 샌드박스 실행 결과는 sandboxExecutionJson 에 JSON 으로 기록 (생성 시점 검증 이력).
 */
@Entity
@Table(
    name = "question_choice_set_item",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_choice_set_item_key",
            columnNames = {"choice_set_uuid", "choice_key"}
        )
    },
    indexes = {
        @Index(name = "idx_choice_set_item_set", columnList = "choice_set_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionChoiceSetItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID choiceSetItemUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID choiceSetUuid;

    @Column(length = 8, nullable = false)
    private String choiceKey;

    @Column(nullable = false)
    private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    @Builder.Default
    private ChoiceKind kind = ChoiceKind.SQL;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(columnDefinition = "JSON")
    private String sandboxExecutionJson;
}
