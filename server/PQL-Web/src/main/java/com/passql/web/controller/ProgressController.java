package com.passql.web.controller;

import com.passql.ai.dto.AiCommentResponse;
import com.passql.application.service.AiCommentService;
import com.passql.submission.dto.HeatmapResponse;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.service.ProgressService;
import com.passql.submission.service.TopicAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/heatmap")
    public ResponseEntity<HeatmapResponse> getHeatmap(
        @RequestParam UUID memberUuid,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(progressService.getHeatmap(memberUuid, from, to));
    }

    @GetMapping("/ai-comment")
    public ResponseEntity<AiCommentResponse> getAiComment(
        @RequestParam UUID memberUuid,
        @RequestParam UUID sessionUuid
    ) {
        return ResponseEntity.ok(aiCommentService.getAiComment(memberUuid, sessionUuid));
    }
}
