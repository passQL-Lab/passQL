package com.passql.web.controller.admin;

import com.passql.ai.dto.GeneratedChoiceDto;
import com.passql.ai.dto.GenerateQuestionFullResult;
import com.passql.ai.dto.QuestionFullContextDto;
import com.passql.meta.service.MetaService;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.*;
import com.passql.question.entity.Question;
import com.passql.question.service.QuestionGenerateService;
import com.passql.question.service.QuestionImportExportService;
import com.passql.question.service.QuestionService;
import com.passql.web.service.AdminQuestionDeleteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Controller
@RequestMapping("/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;
    private final QuestionGenerateService questionGenerateService;
    private final QuestionImportExportService importExportService;
    private final MetaService metaService;
    private final AdminQuestionDeleteService adminQuestionDeleteService;

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

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 직접 등록");
        return "admin/question-register";
    }

    @PostMapping("/register")
    public String register(
            @RequestParam UUID topicUuid,
            @RequestParam(required = false) UUID subtopicUuid,
            @RequestParam int difficulty,
            @RequestParam String executionMode,
            @RequestParam String stem,
            @RequestParam(required = false) String schemaDdl,
            @RequestParam(required = false) String schemaSampleData,
            @RequestParam(required = false) String schemaIntent,
            @RequestParam(required = false) String answerSql,
            @RequestParam(required = false) String hint,
            @RequestParam(required = false) String choiceSetPolicy
    ) {
        ChoiceSetPolicy policy = parseChoiceSetPolicy(choiceSetPolicy);

        Question question = questionGenerateService.createQuestionOnly(
                topicUuid, subtopicUuid, difficulty,
                parseExecutionMode(executionMode),
                stem, schemaDdl, schemaSampleData, schemaIntent,
                answerSql, hint, policy);

        return "redirect:/admin/questions/" + question.getQuestionUuid();
    }

    @GetMapping("/{uuid}")
    public String detail(@PathVariable UUID uuid, Model model) {
        QuestionDetail question = questionService.getQuestion(uuid);
        model.addAttribute("question", question);
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 상세");
        return "admin/question-detail";
    }

    @GetMapping("/{uuid}/edit")
    public String editForm(@PathVariable UUID uuid, Model model) {
        Question question = questionService.getQuestionEntity(uuid);
        model.addAttribute("question", question);
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 편집");
        return "admin/question-edit";
    }

    @PostMapping("/{uuid}/edit")
    public String update(
            @PathVariable UUID uuid,
            @RequestParam UUID topicUuid,
            @RequestParam(required = false) UUID subtopicUuid,
            @RequestParam int difficulty,
            @RequestParam String stem,
            @RequestParam(required = false) String schemaDisplay,
            @RequestParam(required = false) String schemaDdl,
            @RequestParam(required = false) String schemaSampleData,
            @RequestParam(required = false) String schemaIntent,
            @RequestParam(required = false) String answerSql,
            @RequestParam(required = false) String hint,
            @RequestParam String executionMode
    ) {
        questionService.updateQuestion(uuid, stem, schemaDisplay, schemaDdl, schemaSampleData, schemaIntent,
                answerSql, hint, difficulty, parseExecutionMode(executionMode), topicUuid, subtopicUuid);
        return "redirect:/admin/questions/" + uuid;
    }

    @DeleteMapping("/{uuid}")
    public String delete(@PathVariable UUID uuid, RedirectAttributes redirectAttributes) {
        try {
            adminQuestionDeleteService.deleteQuestionCascade(uuid);
            redirectAttributes.addFlashAttribute("successMessage", "문제가 삭제되었습니다.");
        } catch (CustomException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/admin/questions";
    }

    /**
     * 선택된 UUID 목록 일괄삭제 (JSON body: { "questionUuids": [...] }).
     */
    @DeleteMapping("/bulk")
    @ResponseBody
    public ResponseEntity<AdminQuestionDeleteService.BulkDeleteResult> bulkDelete(
            @RequestBody ExportRequest request) {
        AdminQuestionDeleteService.BulkDeleteResult result =
                adminQuestionDeleteService.bulkDeleteQuestions(request.questionUuids());
        return ResponseEntity.ok(result);
    }

    // ── Import / Export ──────────────────────────────────────────

    /**
     * 필터 조건 기반 전체 내보내기 (JSON 파일 다운로드).
     */
    @GetMapping("/export")
    @ResponseBody
    public ResponseEntity<List<QuestionExportDto>> exportByFilter(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String executionMode) {
        List<QuestionExportDto> data = importExportService.exportByFilter(topic, difficulty, executionMode);
        String filename = "passql-questions-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(data);
    }

    /**
     * 선택 UUID 기반 내보내기 (JSON 파일 다운로드).
     */
    @PostMapping("/export")
    @ResponseBody
    public ResponseEntity<List<QuestionExportDto>> exportByUuids(@RequestBody ExportRequest request) {
        List<QuestionExportDto> data = importExportService.exportByUuids(request.questionUuids());
        String filename = "passql-questions-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(data);
    }

    /**
     * 배치 Sandbox 검증 (가져오기 전 미리보기).
     */
    @PostMapping("/import/validate")
    @ResponseBody
    public ResponseEntity<ImportValidationResult> validateImport(@RequestBody List<QuestionExportDto> items) {
        ImportValidationResult result = importExportService.validateBatch(items);
        return ResponseEntity.ok(result);
    }

    /**
     * 검증 후 실제 등록/업데이트.
     */
    @PostMapping("/import")
    @ResponseBody
    public ResponseEntity<ImportResult> importBatch(@RequestBody ImportRequest request) {
        ImportResult result = importExportService.importBatch(request);
        return ResponseEntity.ok(result);
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
            @RequestParam List<String> choiceCorrects,
            @RequestParam List<String> choiceRationales
    ) {
        int choiceCount = choiceKeys.size();
        if (choiceCount != choiceBodies.size() || choiceCount != choiceCorrects.size() || choiceCount != choiceRationales.size()) {
            throw new CustomException(ErrorCode.QUESTION_GENERATE_INPUT_INVALID);
        }
        List<GeneratedChoiceDto> choices = new ArrayList<>();
        for (int i = 0; i < choiceCount; i++) {
            choices.add(new GeneratedChoiceDto(
                    choiceKeys.get(i),
                    choiceBodies.get(i),
                    "true".equalsIgnoreCase(choiceCorrects.get(i)),
                    choiceRationales.get(i)
            ));
        }

        ChoiceSetPolicy policy = parseChoiceSetPolicy(choiceSetPolicy);

        questionGenerateService.createQuestionWithSeedSet(
                topicUuid, subtopicUuid, difficulty,
                schemaDdl, schemaSampleData, schemaIntent,
                stem, answerSql, hint, policy, choices);

        return "redirect:/admin/questions";
    }

    private ExecutionMode parseExecutionMode(String value) {
        try {
            return ExecutionMode.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.QUESTION_GENERATE_INPUT_INVALID);
        }
    }

    private ChoiceSetPolicy parseChoiceSetPolicy(String value) {
        if (value == null) return ChoiceSetPolicy.AI_ONLY;
        try {
            return ChoiceSetPolicy.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.QUESTION_GENERATE_INPUT_INVALID);
        }
    }
}
