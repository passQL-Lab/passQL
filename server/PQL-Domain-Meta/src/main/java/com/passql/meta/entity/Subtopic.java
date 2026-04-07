package com.passql.meta.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subtopic")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subtopic {
    @Id
    private String code;
    private String topicCode;
    private String displayName;
    private Integer sortOrder;
    private Boolean isActive;
}
