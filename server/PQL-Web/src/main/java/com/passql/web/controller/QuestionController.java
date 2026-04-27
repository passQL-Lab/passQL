package com.passql.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.application.service.HomeService;
import com.passql.application.service.QuestionExecutionService;
import com.passql.application.service.RecommendationService;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.member.constant.ChoiceGenerationMode;
import com.passql.member.service.MemberService;
import com.passql.question.dto.ChoiceSetGenerateResponse;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsRequest;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController implements QuestionControllerDocs {

    private final QuestionService questionService;
    private final HomeService homeService;
    private final RecommendationService recommendationService;
    private final SandboxExecutor sandboxExecutor;
    private final QuestionExecutionService questionExecutionService;
    private final SubmissionService submissionService;
    private final ChoiceSetResolver choiceSetResolver;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final ObjectMapper objectMapper;
    private final MemberService memberService;

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
        @AuthMember LoginMember loginMember
    ) {
        return ResponseEntity.ok(homeService.getToday(loginMember.memberUuid()));
    }

    // GET → POST 전환: 제외 UUID 목록이 쿼리스트링으로 누적되면 Tomcat 8KB 헤더 한도 초과 → 400 발생
    @PostMapping("/recommendations")
    public ResponseEntity<RecommendationsResponse> getRecommendations(
        @AuthMember LoginMember loginMember,
        @RequestBody RecommendationsRequest request
    ) {
        // String → UUID 변환 — Controller는 변환만 담당
        List<UUID> excludeUuids = request.excludeQuestionUuids().stream()
                .map(UUID::fromString)
                .toList();
        return ResponseEntity.ok(recommendationService.recommend(request.size(), excludeUuids, loginMember.memberUuid()));
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
        // questionUuid.toString()이 아닌 question의 sandboxDbName 기반으로 실행
        return ResponseEntity.ok(questionExecutionService.executeChoice(questionUuid, sql));
    }

    @PostMapping(value = "/{questionUuid}/generate-choices", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateChoices(
        @PathVariable UUID questionUuid,
        @AuthMember LoginMember loginMember
    ) {
        UUID memberUuid = loginMember.memberUuid();
        SseEmitter emitter = new SseEmitter(60_000L);

        Thread.startVirtualThread(() -> {
            try {
                log.debug("[generate-choices] VirtualThread 진입: questionUuid={}, memberUuid={}", questionUuid, memberUuid);
                // status: generating
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(objectMapper.writeValueAsString(
                                new SseStatusEvent("generating", "선택지 생성 중..."))));

                // ChoiceSetResolver: 모드 조회 후 프리페치 캐시 히트 → 없으면 실시간 AI 생성
                ChoiceGenerationMode mode = memberService.getChoiceGenerationMode(memberUuid);
                QuestionChoiceSet choiceSet = choiceSetResolver.resolveForUser(questionUuid, memberUuid, mode);
                log.info("[generate-choices] resolveForUser 완료: questionUuid={}, choiceSetUuid={}",
                        questionUuid, choiceSet.getChoiceSetUuid());

                // status: validating
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(objectMapper.writeValueAsString(
                                new SseStatusEvent("validating", "SQL 실행 검증 중..."))));

                // Items 조회 → 응답 변환 (isCorrect, rationale 제외)
                log.debug("[generate-choices] items 조회 시작: choiceSetUuid={}", choiceSet.getChoiceSetUuid());
                List<QuestionChoiceSetItem> items = choiceSetItemRepository
                        .findByChoiceSetUuidOrderBySortOrderAsc(choiceSet.getChoiceSetUuid());
                log.debug("[generate-choices] items 조회 완료: count={}", items.size());

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
                log.info("[generate-choices] SSE complete 전송: questionUuid={}, choiceSetUuid={}, itemCount={}",
                        questionUuid, choiceSet.getChoiceSetUuid(), items.size());
                emitter.send(SseEmitter.event()
                        .name("complete")
                        .data(objectMapper.writeValueAsString(response)));

                emitter.complete();
            } catch (CustomException e) {
                log.error("[generate-choices] CustomException 발생: questionUuid={}, code={}, message={}",
                        questionUuid, e.getErrorCode().name(), e.getMessage());
                sendSseError(emitter, e.getErrorCode().name(), e.getMessage(), true);
            } catch (Exception e) {
                // VirtualThread 내 예외는 기본적으로 로그가 없어 silent fail 발생 — 반드시 로깅
                log.error("[generate-choices] 예상치 못한 예외 발생: questionUuid={}", questionUuid, e);
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
        @AuthMember LoginMember loginMember,
        @RequestBody SubmitRequest request
    ) {
        return ResponseEntity.ok(submissionService.submit(
                loginMember.memberUuid(), questionUuid, request.choiceSetId(), request.selectedChoiceKey(), request.sessionUuid()));
    }
}
