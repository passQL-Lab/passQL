package com.passql.question.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "문제 제출 요청")
public record SubmitRequest(
    @Schema(description = "선택한 선택지 키", example = "A")
    String selectedChoiceKey
) {}
