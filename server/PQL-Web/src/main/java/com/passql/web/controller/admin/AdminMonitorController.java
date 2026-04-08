package com.passql.web.controller.admin;

import com.passql.submission.entity.ExecutionLog;
import com.passql.submission.repository.ExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/admin/monitor")
@RequiredArgsConstructor
public class AdminMonitorController {

    private final ExecutionLogRepository executionLogRepository;

    @GetMapping
    public String dashboard(Model model) {
        List<ExecutionLog> logs = executionLogRepository.findTop20ByOrderByExecutedAtDesc();
        model.addAttribute("executionLogs", logs);

        // 최근 24시간 통계
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<ExecutionLog> recentLogs = executionLogRepository.findAll().stream()
                .filter(l -> l.getExecutedAt() != null && l.getExecutedAt().isAfter(since))
                .toList();

        long successCount = recentLogs.stream().filter(l -> "OK".equals(l.getStatus())).count();
        long failCount = recentLogs.stream().filter(l -> !"OK".equals(l.getStatus())).count();
        double avgMs = recentLogs.stream()
                .filter(l -> l.getElapsedMs() != null)
                .mapToLong(ExecutionLog::getElapsedMs)
                .average().orElse(0);

        model.addAttribute("monitorStats", new MonitorStats(successCount, failCount, avgMs, 0L));
        model.addAttribute("currentMenu", "monitor");
        model.addAttribute("pageTitle", "모니터링");
        return "admin/monitor";
    }

    public record MonitorStats(long successCount, long failCount, double avgElapsedMs, long aiCallCount) {}
}
