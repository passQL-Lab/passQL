package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.Dialect;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ExecutionMode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(
    name = "question",
    indexes = {
        @Index(name = "idx_question_topic_uuid", columnList = "topic_uuid"),
        @Index(name = "idx_question_subtopic_uuid", columnList = "subtopic_uuid"),
        @Index(name = "idx_question_active", columnList = "is_active")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Question extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID questionUuid;

    @Column(nullable = false)
    private UUID topicUuid;

    
    private UUID subtopicUuid;

    @Column(nullable = false)
    private Integer difficulty;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ExecutionMode executionMode;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Dialect dialect;

    @Column(length = 255)
    private String sandboxDbName;

    @Column(columnDefinition = "TEXT")
    private String stem;

    @Column(columnDefinition = "TEXT")
    private String schemaDisplay;

    @Column(columnDefinition = "TEXT")
    private String schemaDdl;

    @Column(columnDefinition = "TEXT")
    private String explanationSummary;

    @Column(columnDefinition = "TEXT")
    private String schemaSampleData;

    @Column(columnDefinition = "TEXT")
    private String schemaIntent;

    @Column(columnDefinition = "TEXT")
    private String answerSql;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ChoiceSetPolicy choiceSetPolicy = ChoiceSetPolicy.AI_ONLY;

    @JdbcTypeCode(SqlTypes.JSON)  // Hibernate 6 + PostgreSQL jsonb 컬럼 호환
    @Column(columnDefinition = "JSONB")
    private String extraMetaJson;

    @Column(nullable = false)
    private Boolean isActive = true;

    public void deactivate() {
        this.isActive = false;
    }
}
