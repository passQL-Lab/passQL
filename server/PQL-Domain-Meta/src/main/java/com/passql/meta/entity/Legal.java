package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.meta.constant.LegalStatus;
import com.passql.meta.constant.LegalType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "legal",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_legal_type", columnNames = "type")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Legal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID legalUuid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LegalType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LegalStatus status;
}
