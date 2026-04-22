package com.passql.web.controller;

import com.passql.ai.dto.AiResult;
import com.passql.ai.dto.SimilarQuestion;
import com.passql.ai.service.AiService;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController implements AiControllerDocs {

    private final AiService aiService;

    @PostMapping("/explain-error")
    public ResponseEntity<AiResult> explainError(
        @AuthMember LoginMember loginMember,
        @RequestBody Map<String, Object> body
    ) {
        UUID questionUuid = UUID.fromString(body.get("questionUuid").toString());
        String sql = (String) body.get("sql");
        String errorMessage = (String) body.get("errorMessage");
        return ResponseEntity.ok(aiService.explainError(loginMember.memberUuid(), questionUuid, sql, errorMessage));
    }

    @PostMapping("/diff-explain")
    public ResponseEntity<AiResult> diffExplain(
        @AuthMember LoginMember loginMember,
        @RequestBody Map<String, Object> body
    ) {
        UUID questionUuid = UUID.fromString(body.get("questionUuid").toString());
        String selectedChoiceKey = (String) body.get("selectedChoiceKey");
        return ResponseEntity.ok(aiService.diffExplain(loginMember.memberUuid(), questionUuid, selectedChoiceKey));
    }

    @GetMapping("/similar/{questionUuid}")
    public ResponseEntity<List<SimilarQuestion>> getSimilar(
        @PathVariable UUID questionUuid,
        @RequestParam(defaultValue = "5") int k
    ) {
        return ResponseEntity.ok(aiService.getSimilar(questionUuid, k));
    }
}
