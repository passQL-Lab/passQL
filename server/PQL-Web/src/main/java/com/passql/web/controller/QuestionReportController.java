package com.passql.web.controller;

import com.passql.application.service.QuestionReportService;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.web.dto.report.ReportRequest;
import com.passql.web.dto.report.ReportStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/questions/{questionUuid}/report")
public class QuestionReportController implements QuestionReportControllerDocs {

    private final QuestionReportService questionReportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void submitReport(
            @PathVariable UUID questionUuid,
            @AuthMember LoginMember loginMember,
            @RequestBody ReportRequest request) {

        questionReportService.submitReport(
                questionUuid,
                loginMember.memberUuid(),
                request.submissionUuid(),
                request.choiceSetUuid(),
                request.categories(),
                request.detail()
        );
    }

    @GetMapping("/status")
    public ReportStatusResponse getReportStatus(
            @PathVariable UUID questionUuid,
            @AuthMember LoginMember loginMember,
            @RequestParam UUID submissionUuid) {

        boolean reported = questionReportService.isReported(questionUuid, loginMember.memberUuid(), submissionUuid);
        return new ReportStatusResponse(reported);
    }
}
