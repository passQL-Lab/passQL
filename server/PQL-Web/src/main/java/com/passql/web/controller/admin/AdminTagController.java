package com.passql.web.controller.admin;

import com.passql.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/tags")
@RequiredArgsConstructor
public class AdminTagController {

    private final MetaService metaService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("tags", metaService.getActiveTags());
        return "admin/tags";
    }
}
