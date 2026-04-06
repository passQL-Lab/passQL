package com.passql.web.controller;

import com.passql.ai.dto.AiResult;
import com.passql.ai.dto.SimilarQuestion;
import com.passql.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/explain-error")
    public ResponseEntity<AiResult> explainError(
        @RequestHeader(value = "X-User-UUID") String userUuid,
        @RequestBody Map<String, Object> body
    ) {
        Long questionId = Long.valueOf(body.get("questionId").toString());
        String sql = (String) body.get("sql");
        String errorMessage = (String) body.get("errorMessage");
        return ResponseEntity.ok(aiService.explainError(userUuid, questionId, sql, errorMessage));
    }

    @PostMapping("/diff-explain")
    public ResponseEntity<AiResult> diffExplain(
        @RequestHeader(value = "X-User-UUID") String userUuid,
        @RequestBody Map<String, Object> body
    ) {
        Long questionId = Long.valueOf(body.get("questionId").toString());
        String selectedKey = (String) body.get("selectedKey");
        return ResponseEntity.ok(aiService.diffExplain(userUuid, questionId, selectedKey));
    }

    @GetMapping("/similar/{questionId}")
    public ResponseEntity<List<SimilarQuestion>> getSimilar(
        @PathVariable Long questionId,
        @RequestParam(defaultValue = "5") int k
    ) {
        return ResponseEntity.ok(aiService.getSimilar(questionId, k));
    }
}
