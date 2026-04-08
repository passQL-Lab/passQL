package com.passql.web.controller.admin;

import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleCreateRequest;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/admin/exam-schedules")
@RequiredArgsConstructor
public class AdminExamScheduleController {

    private final ExamScheduleService examScheduleService;

    @GetMapping
    public String list(@RequestParam(value = "certType", required = false) String certType, Model model) {
        CertType type = (certType != null && !certType.isEmpty()) ? CertType.valueOf(certType) : null;
        List<ExamScheduleResponse> schedules = examScheduleService.getAllSchedules(type);

        model.addAttribute("schedules", schedules);
        model.addAttribute("certTypes", CertType.values());
        model.addAttribute("selectedCertType", certType);
        model.addAttribute("pageTitle", "시험 일정 관리");
        model.addAttribute("currentMenu", "exam-schedules");
        return "admin/exam-schedules";
    }

    @PostMapping
    public String create(ExamScheduleCreateRequest request) {
        examScheduleService.createSchedule(request);
        return "redirect:/admin/exam-schedules";
    }

    @PutMapping("/{uuid}/select")
    @ResponseBody
    public ResponseEntity<Void> select(@PathVariable("uuid") UUID uuid) {
        examScheduleService.selectSchedule(uuid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uuid}")
    @ResponseBody
    public ResponseEntity<Void> delete(@PathVariable("uuid") UUID uuid) {
        examScheduleService.deleteSchedule(uuid);
        return ResponseEntity.ok().build();
    }
}
