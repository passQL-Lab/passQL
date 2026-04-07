package com.passql.web.controller;

import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.SubmitResult;
import com.passql.question.service.QuestionService;
import com.passql.question.service.SandboxExecutor;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController implements QuestionControllerDocs {

    private final QuestionService questionService;
    private final SandboxExecutor sandboxExecutor;
    private final SubmissionService submissionService;

    @GetMapping
    public ResponseEntity<Page<QuestionSummary>> getQuestions(
        @RequestParam(required = false) String topic,
        @RequestParam(required = false) String subtopic,
        @RequestParam(required = false) Integer difficulty,
        @RequestParam(required = false) String mode,
        Pageable pageable
    ) {
        return ResponseEntity.ok(questionService.getQuestions(topic, subtopic, difficulty, mode, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionDetail> getQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestion(id));
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<ExecuteResult> executeChoice(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        String sql = body.get("sql");
        return ResponseEntity.ok(sandboxExecutor.execute(id, sql));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmitResult> submit(
        @PathVariable Long id,
        @RequestHeader(value = "X-User-UUID") String userUuid,
        @RequestBody Map<String, String> body
    ) {
        String selectedKey = body.get("selectedKey");
        return ResponseEntity.ok(submissionService.submit(userUuid, id, selectedKey));
    }
}
