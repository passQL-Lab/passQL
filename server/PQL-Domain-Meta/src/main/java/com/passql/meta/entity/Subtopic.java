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
    name = "subtopic",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_subtopic_code", columnNames = "code")
    },
    indexes = {
        @Index(name = "idx_subtopic_topic_uuid", columnList = "topic_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Subtopic extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID subtopicUuid;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(nullable = false)
    private UUID topicUuid;

    @Column(length = 255)
    private String displayName;

    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean isActive = true;
}
