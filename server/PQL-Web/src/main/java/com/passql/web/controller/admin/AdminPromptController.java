package com.passql.web.controller.admin;

import com.passql.meta.service.PromptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/prompts")
@RequiredArgsConstructor
public class AdminPromptController {

    private final PromptService promptService;

    @GetMapping
    public String list(Model model) {
        // TODO: 프롬프트 템플릿 목록 조회 후 Thymeleaf 템플릿 반환
        return "admin/prompts";
    }
}
