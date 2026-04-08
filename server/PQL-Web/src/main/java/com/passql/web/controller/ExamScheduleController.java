package com.passql.web.controller;

import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exam-schedules")
@RequiredArgsConstructor
public class ExamScheduleController implements ExamScheduleControllerDocs {

    private final ExamScheduleService examScheduleService;

    @GetMapping
    public ResponseEntity<List<ExamScheduleResponse>> getSchedules(
            @RequestParam(value = "certType", required = false) String certType) {
        CertType type = (certType != null) ? CertType.valueOf(certType) : null;
        return ResponseEntity.ok(examScheduleService.getAllSchedules(type));
    }

    @GetMapping("/selected")
    public ResponseEntity<ExamScheduleResponse> getSelected() {
        return ResponseEntity.ok(examScheduleService.getSelectedSchedule());
    }
}
