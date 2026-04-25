package com.passql.meta.dto;

import com.passql.meta.constant.LegalStatus;
import com.passql.meta.constant.LegalType;
import com.passql.meta.entity.Legal;

public record LegalResponse(
        LegalType type,
        String title,
        String content,
        LegalStatus status
) {
    public static LegalResponse from(Legal legal) {
        return new LegalResponse(
                legal.getType(),
                legal.getTitle(),
                legal.getContent(),
                legal.getStatus()
        );
    }
}
