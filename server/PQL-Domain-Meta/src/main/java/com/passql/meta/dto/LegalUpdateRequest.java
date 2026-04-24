package com.passql.meta.dto;

import jakarta.validation.constraints.NotBlank;

public record LegalUpdateRequest(
        @NotBlank String title,
        @NotBlank String content
) {}
