package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "concept_doc")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConceptDoc extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String tagKey;
    private String title;
    @Column(columnDefinition = "TEXT") private String bodyMd;
    private String embeddingVersion;
    private Boolean isActive;
}
