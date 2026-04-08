package com.passql.web.controller.admin;

import com.passql.meta.service.MetaService;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;
    private final MetaService metaService;

    @GetMapping
    public String list(Model model,
                       @RequestParam(required = false) String topic,
                       @RequestParam(required = false) Integer difficulty,
                       @RequestParam(required = false) String executionMode,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, clampedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        model.addAttribute("questions", questionService.getQuestions(topic, null, difficulty, executionMode, pageable));
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 관리");
        return "admin/questions";
    }
}
