package com.passql.web.controller.admin;

import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;

    @GetMapping
    public String list(Model model, Pageable pageable) {
        // TODO: 문제 목록 조회 후 Thymeleaf 템플릿 반환
        return "admin/questions";
    }
}
