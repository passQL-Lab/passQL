package com.passql.web.controller;

import com.passql.application.service.HomeService;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.dto.SubmitRequest;
import com.passql.question.dto.SubmitResult;
import com.passql.question.dto.TodayQuestionResponse;
import com.passql.question.service.QuestionService;
import com.passql.question.service.SandboxExecutor;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController implements QuestionControllerDocs {

    private final QuestionService questionService;
    private final HomeService homeService;
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

    @GetMapping("/today")
    public ResponseEntity<TodayQuestionResponse> getToday(
        @RequestParam(required = false) UUID memberUuid
    ) {
        return ResponseEntity.ok(homeService.getToday(memberUuid));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<RecommendationsResponse> getRecommendations(
        @RequestParam(defaultValue = "3") int size,
        @RequestParam(required = false) UUID excludeQuestionUuid
    ) {
        return ResponseEntity.ok(questionService.getRecommendations(size, excludeQuestionUuid));
    }

    @GetMapping("/{questionUuid}")
    public ResponseEntity<QuestionDetail> getQuestion(@PathVariable UUID questionUuid) {
        return ResponseEntity.ok(questionService.getQuestion(questionUuid));
    }

    @PostMapping("/{questionUuid}/execute")
    public ResponseEntity<ExecuteResult> executeChoice(
        @PathVariable UUID questionUuid,
        @RequestBody Map<String, String> body
    ) {
        String sql = body.get("sql");
        return ResponseEntity.ok(sandboxExecutor.execute(questionUuid.toString(), sql));
    }

    @PostMapping("/{questionUuid}/submit")
    public ResponseEntity<SubmitResult> submit(
        @PathVariable UUID questionUuid,
        @RequestHeader(value = "X-Member-UUID") UUID memberUuid,
        @RequestBody SubmitRequest request
    ) {
        return ResponseEntity.ok(submissionService.submit(memberUuid, questionUuid, request.selectedChoiceKey()));
    }
}
