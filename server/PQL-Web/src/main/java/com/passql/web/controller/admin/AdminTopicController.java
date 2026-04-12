package com.passql.web.controller.admin;

import com.passql.meta.dto.TopicUpdateRequest;
import com.passql.meta.service.MetaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/topics")
@RequiredArgsConstructor
public class AdminTopicController {

    private final MetaService metaService;

    @GetMapping
    public String list(Model model, @RequestParam(required = false) String topicCode) {
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("selectedTopicCode", topicCode);
        if (topicCode != null) {
            model.addAttribute("subtopics", metaService.getSubtopics(topicCode));
        }
        model.addAttribute("currentMenu", "topics");
        model.addAttribute("pageTitle", "토픽/태그 관리");
        return "admin/topics";
    }

    /** 토픽 편집 — displayName, sortOrder, isActive 수정 */
    @PutMapping("/{code}")
    @ResponseBody
    public ResponseEntity<Void> updateTopic(
            @PathVariable String code,
            @Valid @RequestBody TopicUpdateRequest request) {
        metaService.updateTopic(code, request);
        return ResponseEntity.ok().build();
    }
}
