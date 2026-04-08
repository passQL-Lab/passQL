package com.passql.web.controller.admin;

import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/monitor")
@RequiredArgsConstructor
public class AdminMonitorController {

    private final SubmissionService submissionService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("executionLogs", submissionService.getRecentLogs());
        model.addAttribute("monitorStats", submissionService.getStats24h());
        model.addAttribute("currentMenu", "monitor");
        model.addAttribute("pageTitle", "모니터링");
        return "admin/monitor";
    }
}
