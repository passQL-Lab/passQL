package com.passql.meta.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** 토픽 편집 요청 DTO */
public record TopicUpdateRequest(
        @NotBlank String displayName,
        @NotNull @Min(1) Integer sortOrder,
        @NotNull Boolean isActive
) {}
