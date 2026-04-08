package com.passql.web.controller.admin;

import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Controller
@RequestMapping("/admin/prompts")
@RequiredArgsConstructor
public class AdminPromptController {

    private final PromptService promptService;

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
}
