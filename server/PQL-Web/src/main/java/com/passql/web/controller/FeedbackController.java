package com.passql.web.controller;

import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController implements FeedbackControllerDocs {

    private final FeedbackService feedbackService;

    @PostMapping
    public FeedbackSubmitResponse submit(
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestBody FeedbackSubmitRequest request
    ) {
        return feedbackService.submit(memberUuid, request);
    }

    @GetMapping("/me")
    public FeedbackListResponse getMyFeedbacks(
        @RequestHeader("X-Member-UUID") UUID memberUuid
    ) {
        return feedbackService.getMyFeedbacks(memberUuid);
    }
}
