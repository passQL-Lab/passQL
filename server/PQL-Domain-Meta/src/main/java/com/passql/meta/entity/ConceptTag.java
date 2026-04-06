package com.passql.meta.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "concept_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConceptTag {
    @Id
    private String tagKey;
    private String labelKo;
    private String category;
    private String description;
    private Boolean isActive;
    private Integer sortOrder;
}
