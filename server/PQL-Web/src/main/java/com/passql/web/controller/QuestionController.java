package com.passql.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.application.service.HomeService;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.ChoiceSetGenerateResponse;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.dto.SseErrorEvent;
import com.passql.question.dto.SseStatusEvent;
import com.passql.question.dto.SubmitRequest;
import com.passql.question.dto.SubmitResult;
import com.passql.question.dto.TodayQuestionResponse;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.service.ChoiceSetResolver;
import com.passql.question.service.QuestionService;
import com.passql.question.service.SandboxExecutor;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
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
    private final ChoiceSetResolver choiceSetResolver;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final ObjectMapper objectMapper;

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
        if (sql == null || sql.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        return ResponseEntity.ok(sandboxExecutor.execute(questionUuid.toString(), sql));
    }

    @PostMapping(value = "/{questionUuid}/generate-choices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateChoices(
        @PathVariable UUID questionUuid,
        @RequestHeader(value = "X-Member-UUID") UUID memberUuid
    ) {
        SseEmitter emitter = new SseEmitter(60_000L);

        Thread.startVirtualThread(() -> {
            try {
                // status: generating
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(objectMapper.writeValueAsString(
                                new SseStatusEvent("generating", "선택지 생성 중..."))));

                // ChoiceSetResolver: 프리페치 캐시 히트 → 없으면 실시간 AI 생성
                QuestionChoiceSet choiceSet = choiceSetResolver.resolveForUser(questionUuid, memberUuid);

                // status: validating
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(objectMapper.writeValueAsString(
                                new SseStatusEvent("validating", "SQL 실행 검증 중..."))));

                // Items 조회 → 응답 변환 (isCorrect, rationale 제외)
                List<QuestionChoiceSetItem> items = choiceSetItemRepository
                        .findByChoiceSetUuidOrderBySortOrderAsc(choiceSet.getChoiceSetUuid());

                List<ChoiceSetGenerateResponse.ChoiceItem> responseItems = items.stream()
                        .map(item -> new ChoiceSetGenerateResponse.ChoiceItem(
                                item.getChoiceKey(),
                                item.getKind().name(),
                                item.getBody(),
                                item.getSortOrder()))
                        .toList();

                ChoiceSetGenerateResponse response = new ChoiceSetGenerateResponse(
                        choiceSet.getChoiceSetUuid(), responseItems);

                // complete
                emitter.send(SseEmitter.event()
                        .name("complete")
                        .data(objectMapper.writeValueAsString(response)));

                emitter.complete();
            } catch (CustomException e) {
                sendSseError(emitter, e.getErrorCode().name(), e.getMessage(), true);
            } catch (Exception e) {
                sendSseError(emitter, "GENERATION_FAILED", "선택지 생성에 실패했습니다", true);
            }
        });

        return emitter;
    }

    private void sendSseError(SseEmitter emitter, String code, String message, boolean retryable) {
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(objectMapper.writeValueAsString(
                            new SseErrorEvent(code, message, retryable))));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }

    @PostMapping("/{questionUuid}/submit")
    public ResponseEntity<SubmitResult> submit(
        @PathVariable UUID questionUuid,
        @RequestHeader(value = "X-Member-UUID") UUID memberUuid,
        @RequestBody SubmitRequest request
    ) {
        return ResponseEntity.ok(submissionService.submit(
                memberUuid, questionUuid, request.choiceSetId(), request.selectedChoiceKey()));
    }
}
