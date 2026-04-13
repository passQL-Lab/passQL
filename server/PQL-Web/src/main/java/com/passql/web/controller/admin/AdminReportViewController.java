package com.passql.web.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Controller
@RequestMapping("/admin/reports")
public class AdminReportViewController {

    @GetMapping
    public String reportsPage(Model model) {
        model.addAttribute("pageTitle", "신고 관리");
        model.addAttribute("currentMenu", "reports");
        return "admin/reports";
    }

    @GetMapping("/{questionUuid}")
    public String reportDetailPage(@PathVariable UUID questionUuid, Model model) {
        model.addAttribute("pageTitle", "신고 상세");
        model.addAttribute("currentMenu", "reports");
        model.addAttribute("questionUuid", questionUuid);
        return "admin/report-detail";
    }
}
