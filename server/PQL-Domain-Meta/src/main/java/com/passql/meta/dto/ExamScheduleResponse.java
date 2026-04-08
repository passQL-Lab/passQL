package com.passql.meta.dto;

import com.passql.meta.entity.ExamSchedule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ExamScheduleResponse {

    private UUID examScheduleUuid;
    private String certType;
    private Integer round;
    private LocalDate examDate;
    private Boolean isSelected;

    public static ExamScheduleResponse from(ExamSchedule e) {
        return new ExamScheduleResponse(
            e.getExamScheduleUuid(),
            e.getCertType().name(),
            e.getRound(),
            e.getExamDate(),
            e.getIsSelected()
        );
    }
}
