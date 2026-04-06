package com.passql.web.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/concepts")
@RequiredArgsConstructor
public class AdminConceptController {

    @GetMapping
    public String list(Model model) {
        // TODO: 개념 문서 목록 조회 후 Thymeleaf 템플릿 반환
        return "admin/concepts";
    }
}
