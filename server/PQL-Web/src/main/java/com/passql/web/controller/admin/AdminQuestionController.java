package com.passql.web.controller.admin;

import com.passql.ai.dto.GeneratedChoiceDto;
import com.passql.ai.dto.GenerateQuestionFullResult;
import com.passql.ai.dto.QuestionFullContextDto;
import com.passql.meta.service.MetaService;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.entity.Question;
import com.passql.question.service.QuestionGenerateService;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@Controller
@RequestMapping("/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;
    private final QuestionGenerateService questionGenerateService;
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

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 등록 (AI 생성)");
        return "admin/question-new";
    }

    /**
     * AI 문제 생성 (JSON 반환, AJAX preview 용).
     */
    @PostMapping("/generate-full")
    @ResponseBody
    public ResponseEntity<GenerateQuestionFullResult> generateFull(
            @RequestBody QuestionFullContextDto context) {
        GenerateQuestionFullResult result = questionGenerateService.generate(context);
        return ResponseEntity.ok(result);
    }

    /**
     * 관리자 검수 후 저장.
     */
    @PostMapping
    public String save(
            @RequestParam UUID topicUuid,
            @RequestParam(required = false) UUID subtopicUuid,
            @RequestParam int difficulty,
            @RequestParam String schemaDdl,
            @RequestParam(required = false) String schemaSampleData,
            @RequestParam(required = false) String schemaIntent,
            @RequestParam String stem,
            @RequestParam String answerSql,
            @RequestParam(required = false) String hint,
            @RequestParam(required = false) String choiceSetPolicy,
            @RequestParam List<String> choiceKeys,
            @RequestParam List<String> choiceBodies,
            @RequestParam List<Boolean> choiceCorrects,
            @RequestParam List<String> choiceRationales
    ) {
        List<GeneratedChoiceDto> choices = new java.util.ArrayList<>();
        for (int i = 0; i < choiceKeys.size(); i++) {
            choices.add(new GeneratedChoiceDto(
                    choiceKeys.get(i),
                    choiceBodies.get(i),
                    Boolean.TRUE.equals(choiceCorrects.get(i)),
                    choiceRationales.get(i)
            ));
        }

        ChoiceSetPolicy policy = choiceSetPolicy != null
                ? ChoiceSetPolicy.valueOf(choiceSetPolicy)
                : ChoiceSetPolicy.AI_ONLY;

        questionGenerateService.createQuestionWithSeedSet(
                topicUuid, subtopicUuid, difficulty,
                schemaDdl, schemaSampleData, schemaIntent,
                stem, answerSql, hint, policy, choices);

        return "redirect:/admin/questions";
    }
}
