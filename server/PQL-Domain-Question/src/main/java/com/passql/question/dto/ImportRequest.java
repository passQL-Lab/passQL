package com.passql.question.dto;

import java.util.List;

public record ImportRequest(
    List<QuestionExportDto> items,
    String importMode,
    List<String> sandboxStatuses
) {}
