package com.passql.web.controller.admin;

import com.passql.meta.constant.LegalStatus;
import com.passql.meta.constant.LegalType;
import com.passql.meta.dto.LegalUpdateRequest;
import com.passql.meta.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/legal")
@RequiredArgsConstructor
public class AdminLegalController {

    private final LegalService legalService;

    @GetMapping
    public String list(Model model) {
        model.addAttribute("legals", legalService.findAll());
        model.addAttribute("legalTypes", LegalType.values());
        model.addAttribute("currentMenu", "legal");
        model.addAttribute("pageTitle", "약관 관리");
        return "admin/legal";
    }

    @PutMapping("/{type}")
    @ResponseBody
    public ResponseEntity<Void> update(@PathVariable LegalType type,
                                       @RequestBody LegalUpdateRequest request) {
        legalService.update(type, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{type}/status")
    @ResponseBody
    public ResponseEntity<Void> updateStatus(@PathVariable LegalType type,
                                             @RequestParam LegalStatus status) {
        legalService.updateStatus(type, status);
        return ResponseEntity.ok().build();
    }
}
