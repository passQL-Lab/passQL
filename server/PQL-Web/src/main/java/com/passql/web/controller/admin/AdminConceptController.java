package com.passql.web.controller.admin;

import com.passql.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller
@RequestMapping("/admin/concepts")
@RequiredArgsConstructor
public class AdminConceptController {

    private final MetaService metaService;

    @GetMapping
    public String list(Model model, @RequestParam(required = false) String tagKey) {
        model.addAttribute("conceptTags", metaService.getActiveTags());
        model.addAttribute("conceptDocs", tagKey != null ? metaService.getDocsByTagKey(tagKey) : List.of());
        model.addAttribute("selectedTagKey", tagKey);
        model.addAttribute("currentMenu", "concepts");
        model.addAttribute("pageTitle", "개념 문서 관리");
        return "admin/concepts";
    }

    @PostMapping
    public String createDoc(@RequestParam String tagKey,
                            @RequestParam String title,
                            @RequestParam(required = false) String bodyMd) {
        metaService.createDoc(tagKey, title, bodyMd);
        return "redirect:/admin/concepts?tagKey=" + tagKey;
    }

    @PutMapping("/{uuid}")
    @ResponseBody
    public ResponseEntity<Void> updateDoc(@PathVariable UUID uuid,
                                          @RequestBody Map<String, String> body) {
        metaService.updateDocBody(uuid, body.get("bodyMd"));
        return ResponseEntity.ok().build();
    }
}
