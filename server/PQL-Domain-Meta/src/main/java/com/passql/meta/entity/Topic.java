package com.passql.meta.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "topic")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Topic {
    @Id
    private String code;
    private String displayName;
    private Integer sortOrder;
    private Boolean isActive;
}
