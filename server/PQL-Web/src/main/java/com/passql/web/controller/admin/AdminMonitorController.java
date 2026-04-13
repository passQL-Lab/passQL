package com.passql.web.controller.admin;

import com.passql.ai.client.GeminiClient;
import com.passql.ai.dto.AiStats;
import com.passql.submission.dto.MonitorStats;
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
    private final GeminiClient geminiClient;

    @GetMapping
    public String dashboard(Model model) {
        MonitorStats raw = submissionService.getStats24h();
        long geminiCount = geminiClient.getCallCount();

        // aiCallCount에 실제 Gemini 호출 횟수 반영
        MonitorStats monitorStats = new MonitorStats(
                raw.successCount(), raw.failCount(), raw.avgElapsedMs(), geminiCount);

        model.addAttribute("executionLogs", submissionService.getRecentLogs());
        model.addAttribute("monitorStats", monitorStats);
        // Gemini 누적 호출 횟수 포함, 나머지 AI 기능은 미구현(-1)
        model.addAttribute("aiStats", AiStats.withGeminiCount(geminiCount));
        model.addAttribute("currentMenu", "monitor");
        model.addAttribute("pageTitle", "모니터링");
        return "admin/monitor";
    }
}
