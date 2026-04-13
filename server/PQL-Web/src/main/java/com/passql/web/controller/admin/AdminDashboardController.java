package com.passql.web.controller.admin;

import com.passql.ai.client.GeminiClient;
import com.passql.application.dto.DashboardStats;
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
    private final GeminiClient geminiClient;

    @GetMapping({"", "/"})
    public String dashboard(Model model) {
        DashboardStats raw = adminDashboardService.collect();

        // aiCallCount에 실제 Gemini 누적 호출 횟수 반영
        DashboardStats stats = new DashboardStats(
                raw.totalQuestions(),
                raw.questionsByTopic(),
                raw.totalMembers(),
                raw.activeMembers(),
                raw.suspendedMembers(),
                raw.todaySubmissions(),
                geminiClient.getCallCount(),
                raw.errorRate()
        );

        model.addAttribute("stats", stats);
        model.addAttribute("recentLogs", submissionService.getRecentLogs());
        model.addAttribute("currentMenu", "dashboard");
        model.addAttribute("pageTitle", "대시보드");
        return "admin/dashboard";
    }
}
