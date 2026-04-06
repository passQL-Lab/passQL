package com.passql.web.controller;

import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meta")
@RequiredArgsConstructor
public class MetaController {

    private final MetaService metaService;

    @GetMapping("/topics")
    public ResponseEntity<List<TopicTree>> getTopics() {
        return ResponseEntity.ok(metaService.getTopicTree());
    }

    @GetMapping("/tags")
    public ResponseEntity<List<ConceptTag>> getTags() {
        return ResponseEntity.ok(metaService.getActiveTags());
    }
}
