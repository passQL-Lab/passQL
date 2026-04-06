package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.Dialect;
import com.passql.question.constant.ExecutionMode;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String topicCode;
    private String subtopicCode;
    private Integer difficulty;
    @Enumerated(EnumType.STRING) private ExecutionMode executionMode;
    @Enumerated(EnumType.STRING) private Dialect dialect;
    private String sandboxDbName;
    @Column(columnDefinition = "TEXT") private String stem;
    @Column(columnDefinition = "TEXT") private String schemaDisplay;
    @Column(columnDefinition = "TEXT") private String schemaDdl;
    @Column(columnDefinition = "TEXT") private String explanationSummary;
    @Column(columnDefinition = "JSON") private String extraMetaJson;
}
