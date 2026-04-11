package com.passql.web.controller.admin;

import com.passql.application.service.AdminDashboardService;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 대시보드 컨트롤러.
 *
 * <p>{@code /admin} 진입점으로, AdminDashboardService를 통해 통계를 수집해
 * dashboard.html 템플릿에 바인딩한다.
 */
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final SubmissionService submissionService;

    @GetMapping({"", "/"})
    public String dashboard(Model model) {
        // 통계 집계 (여러 도메인 조합)
        model.addAttribute("stats", adminDashboardService.collect());

        // 최근 실행 로그 20건 (dashboard.html의 recentLogs 변수)
        model.addAttribute("recentLogs", submissionService.getRecentLogs());

        model.addAttribute("currentMenu", "dashboard");
        model.addAttribute("pageTitle", "대시보드");
        return "admin/dashboard";
    }
}
