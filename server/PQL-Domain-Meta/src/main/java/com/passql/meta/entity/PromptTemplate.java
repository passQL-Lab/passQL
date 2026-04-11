package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(
    name = "prompt_template",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_prompt_template_key_version", columnNames = {"key_name", "version"})
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PromptTemplate extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID promptTemplateUuid;

    @Column(nullable = false, length = 255)
    private String keyName;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(length = 100)
    private String model;

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(columnDefinition = "TEXT")
    private String userTemplate;

    private Float temperature;

    private Integer maxTokens;

    @Column(length = 500)
    private String note;

    @JdbcTypeCode(SqlTypes.JSON)  // Hibernate 6 + PostgreSQL jsonb 컬럼 호환
    @Column(columnDefinition = "JSONB")
    private String extraParamsJson;
}
