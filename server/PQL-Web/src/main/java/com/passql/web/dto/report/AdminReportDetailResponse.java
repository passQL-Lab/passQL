package com.passql.web.dto.report;

import com.passql.question.constant.ReportCategory;
import com.passql.question.constant.ReportStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminReportDetailResponse(
        QuestionInfo question,
        List<ReportItem> reports
) {
    public record QuestionInfo(UUID questionUuid, String stem, Boolean isActive) {}

    public record ReportItem(
            UUID reportUuid,
            UUID memberUuid,
            UUID submissionUuid,
            UUID choiceSetUuid,
            List<ReportCategory> categories,
            String detail,
            ReportStatus status,
            LocalDateTime createdAt
    ) {}
}
