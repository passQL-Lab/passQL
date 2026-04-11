package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
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
    name = "concept_doc",
    indexes = {
        @Index(name = "idx_concept_doc_tag_uuid", columnList = "concept_tag_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ConceptDoc extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID conceptDocUuid;

    @Column(nullable = false)
    private UUID conceptTagUuid;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String bodyMd;

    @Column(length = 100)
    private String embeddingVersion;

    @Column(nullable = false)
    private Boolean isActive = true;
}
