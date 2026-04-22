package com.passql.web.controller;

import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController implements FeedbackControllerDocs {

    private final FeedbackService feedbackService;

    @PostMapping
    public FeedbackSubmitResponse submit(
        @AuthMember LoginMember loginMember,
        @RequestBody FeedbackSubmitRequest request
    ) {
        return feedbackService.submit(loginMember.memberUuid(), request);
    }

    @GetMapping("/me")
    public FeedbackListResponse getMyFeedbacks(
        @AuthMember LoginMember loginMember
    ) {
        return feedbackService.getMyFeedbacks(loginMember.memberUuid());
    }
}
