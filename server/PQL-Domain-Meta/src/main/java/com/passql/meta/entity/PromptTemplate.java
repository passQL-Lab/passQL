package com.passql.meta.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prompt_template")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PromptTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String keyName;
    private Integer version;
    private Boolean isActive;
    private String model;
    @Column(columnDefinition = "TEXT") private String systemPrompt;
    @Column(columnDefinition = "TEXT") private String userTemplate;
    private Float temperature;
    private Integer maxTokens;
    private String note;
    @Column(columnDefinition = "JSON") private String extraParamsJson;
}
