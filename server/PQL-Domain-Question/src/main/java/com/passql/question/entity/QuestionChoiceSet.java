package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 한 Question 에 대해 생성된 4지선다 선택지 세트.
 * AI_RUNTIME / AI_PREFETCH / AI_ADMIN_PREVIEW / ADMIN_SEED / ADMIN_CURATED 모두 이 테이블에 저장된다.
 * 실패 케이스(status=FAILED)도 관측·디버깅용으로 기록한다.
 */
@Entity
@Table(
    name = "question_choice_set",
    indexes = {
        @Index(name = "idx_choice_set_question", columnList = "question_uuid"),
        @Index(name = "idx_choice_set_source", columnList = "source"),
        @Index(name = "idx_choice_set_status", columnList = "status"),
        @Index(
            name = "idx_choice_set_prefetch",
            columnList = "question_uuid, generated_for_member_uuid, consumed_at"
        )
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionChoiceSet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID choiceSetUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID questionUuid;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private ChoiceSetSource source;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ChoiceSetStatus status = ChoiceSetStatus.OK;

    @Column(columnDefinition = "CHAR(36)")
    private UUID generatedForMemberUuid;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isReusable = false;

    @Column(columnDefinition = "CHAR(36)")
    private UUID promptTemplateUuid;

    @Column(length = 100)
    private String modelName;

    private Float temperature;

    private Integer maxTokens;

    @Column(nullable = false)
    @Builder.Default
    private Integer generationAttempts = 1;

    @Column(nullable = false)
    @Builder.Default
    private Boolean sandboxValidationPassed = false;

    @Column(columnDefinition = "JSON")
    private String rawResponseJson;

    private Integer totalElapsedMs;

    @Column(columnDefinition = "CHAR(36)")
    private UUID createdByMemberUuid;

    private LocalDateTime consumedAt;

    @Column(length = 64)
    private String lastErrorCode;
}
