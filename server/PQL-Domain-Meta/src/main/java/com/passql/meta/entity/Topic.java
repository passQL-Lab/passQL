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
    name = "topic",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_topic_code", columnNames = "code")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Topic extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID topicUuid;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(length = 255)
    private String displayName;

    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean isActive = true;
}
