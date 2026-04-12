package com.passql.question.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

@Schema(description = "문제 제출 요청")
public record SubmitRequest(
    @Schema(description = "선택지 세트 UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID choiceSetId,

    @Schema(description = "선택한 선택지 키", example = "A")
    String selectedChoiceKey,

    @Schema(description = "퀴즈 세션 UUID — AI 코멘트 세션 집계에 사용", example = "550e8400-e29b-41d4-a716-446655440001")
    UUID sessionUuid
) {}
