package com.passql.web.controller.admin;

import com.passql.meta.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
public class AdminSettingController {

    private final AppSettingService appSettingService;

    @GetMapping
    public String list(Model model) {
        // TODO: 앱 설정 목록 조회 후 Thymeleaf 템플릿 반환
        return "admin/settings";
    }
}
