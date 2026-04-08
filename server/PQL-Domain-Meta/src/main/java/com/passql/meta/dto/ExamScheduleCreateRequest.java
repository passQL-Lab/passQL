package com.passql.meta.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ExamScheduleCreateRequest {

    private String certType;
    private Integer round;
    private LocalDate examDate;
}
