package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.meta.constant.CertType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "exam_schedule",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_exam_schedule_cert_round", columnNames = {"cert_type", "round"})
    },
    indexes = {
        @Index(name = "idx_exam_schedule_cert", columnList = "cert_type"),
        @Index(name = "idx_exam_schedule_selected", columnList = "is_selected")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExamSchedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID examScheduleUuid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CertType certType;

    @Column(nullable = false)
    private Integer round;

    @Column(nullable = false)
    private LocalDate examDate;

    @Column(nullable = false)
    private Boolean isSelected = false;
}
