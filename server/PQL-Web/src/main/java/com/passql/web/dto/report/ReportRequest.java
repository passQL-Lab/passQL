package com.passql.web.dto.report;

import com.passql.question.constant.ReportCategory;

import java.util.List;
import java.util.UUID;

public record ReportRequest(
        UUID choiceSetUuid,
        UUID submissionUuid,
        List<ReportCategory> categories,
        String detail
) {}
