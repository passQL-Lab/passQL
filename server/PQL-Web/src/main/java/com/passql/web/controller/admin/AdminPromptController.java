package com.passql.web.controller.admin;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.LlmConfigDto;
import com.passql.ai.dto.TestPromptRequest;
import com.passql.ai.dto.TestPromptResult;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Controller
@RequestMapping("/admin/prompts")
@RequiredArgsConstructor
public class AdminPromptController {

    private final PromptService promptService;
    private final AiGatewayClient aiGatewayClient;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("promptTemplates", promptService.findAll());
        model.addAttribute("currentMenu", "prompts");
        model.addAttribute("pageTitle", "프롬프트 관리");
        return "admin/prompts";
    }

    @GetMapping("/{uuid}")
    public String detail(@PathVariable UUID uuid, Model model) {
        model.addAttribute("promptTemplates", promptService.findAll());
        promptService.findById(uuid)
                .ifPresent(pt -> model.addAttribute("selectedPrompt", pt));
        model.addAttribute("currentMenu", "prompts");
        model.addAttribute("pageTitle", "프롬프트 관리");
        return "admin/prompts";
    }

    @PostMapping
    public String create(@ModelAttribute PromptTemplate form) {
        PromptTemplate created = promptService.create(form);
        return "redirect:/admin/prompts/" + created.getPromptTemplateUuid();
    }

    @PutMapping("/{uuid}")
    public String update(@PathVariable UUID uuid, @ModelAttribute PromptTemplate form) {
        promptService.update(uuid, form);
        return "redirect:/admin/prompts/" + uuid;
    }

    /**
     * 프롬프트 테스트 페이지.
     */
    @GetMapping("/{uuid}/test")
    public String testPage(@PathVariable UUID uuid, Model model) {
        promptService.findById(uuid)
                .ifPresent(pt -> model.addAttribute("prompt", pt));
        model.addAttribute("promptTemplates", promptService.findAll());
        model.addAttribute("currentMenu", "prompts");
        model.addAttribute("pageTitle", "프롬프트 테스트");
        return "admin/prompt-test";
    }

    /**
     * 프롬프트 테스트 실행 (JSON).
     */
    @PostMapping("/{uuid}/test")
    @ResponseBody
    public ResponseEntity<TestPromptResult> testExecute(
            @PathVariable UUID uuid,
            @RequestBody Map<String, String> variables) {
        PromptTemplate prompt = promptService.findById(uuid)
                .orElseThrow(() -> new com.passql.common.exception.CustomException(
                        com.passql.common.exception.constant.ErrorCode.PROMPT_NOT_FOUND));

        LlmConfigDto llmConfig = new LlmConfigDto(
                prompt.getModel(),
                prompt.getSystemPrompt(),
                prompt.getUserTemplate(),
                prompt.getTemperature(),
                prompt.getMaxTokens(),
                null
        );

        TestPromptRequest req = new TestPromptRequest(llmConfig, variables);
        TestPromptResult result = aiGatewayClient.testPrompt(req);
        return ResponseEntity.ok(result);
    }

    /**
     * 버전 활성화.
     */
    @PutMapping("/{uuid}/activate")
    @ResponseBody
    public ResponseEntity<Void> activate(@PathVariable UUID uuid) {
        promptService.activateVersion(uuid);
        return ResponseEntity.ok().build();
    }
}
