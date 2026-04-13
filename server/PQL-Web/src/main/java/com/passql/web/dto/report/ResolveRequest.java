package com.passql.web.dto.report;

import com.passql.question.constant.CorrectionScope;

public record ResolveRequest(
        CorrectionScope correctionScope,
        Boolean deactivateQuestion
) {}
