package com.passql.web.controller;

import com.passql.ai.dto.AiCommentResponse;
import com.passql.application.service.AiCommentService;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.service.ProgressService;
import com.passql.submission.service.TopicAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController implements ProgressControllerDocs {

    private final ProgressService progressService;
    private final TopicAnalysisService topicAnalysisService;
    private final AiCommentService aiCommentService;

    @GetMapping
    public ResponseEntity<ProgressResponse> getProgress(
        @RequestParam UUID memberUuid
    ) {
        return ResponseEntity.ok(progressService.getProgress(memberUuid));
    }

    @GetMapping("/topic-analysis")
    public ResponseEntity<TopicAnalysisResponse> getTopicAnalysis(
        @RequestParam UUID memberUuid
    ) {
        return ResponseEntity.ok(topicAnalysisService.getTopicAnalysis(memberUuid));
    }

    @GetMapping("/ai-comment")
    public ResponseEntity<AiCommentResponse> getAiComment(
        @RequestParam UUID memberUuid
    ) {
        return ResponseEntity.ok(aiCommentService.getAiComment(memberUuid));
    }
}
