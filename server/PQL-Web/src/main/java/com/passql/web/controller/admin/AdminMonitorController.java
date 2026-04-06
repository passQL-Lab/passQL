package com.passql.web.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/monitor")
@RequiredArgsConstructor
public class AdminMonitorController {

    @GetMapping
    public String dashboard(Model model) {
        // TODO: 시스템 모니터링 대시보드 데이터 조회
        return "admin/monitor";
    }
}
