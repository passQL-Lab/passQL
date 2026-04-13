package com.passql.web.controller;

import com.passql.application.service.QuestionReportService;
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
            @RequestHeader("X-Member-UUID") UUID memberUuid,
            @RequestBody ReportRequest request) {

        questionReportService.submitReport(
                questionUuid,
                memberUuid,
                request.submissionUuid(),
                request.choiceSetUuid(),
                request.categories(),
                request.detail()
        );
    }

    @GetMapping("/status")
    public ReportStatusResponse getReportStatus(
            @PathVariable UUID questionUuid,
            @RequestHeader("X-Member-UUID") UUID memberUuid,
            @RequestParam UUID submissionUuid) {

        boolean reported = questionReportService.isReported(questionUuid, memberUuid, submissionUuid);
        return new ReportStatusResponse(reported);
    }
}
