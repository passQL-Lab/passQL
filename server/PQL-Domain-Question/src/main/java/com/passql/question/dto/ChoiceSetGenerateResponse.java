package com.passql.question.dto;

import java.util.List;
import java.util.UUID;

public record ChoiceSetGenerateResponse(
    UUID choiceSetId,
    List<ChoiceItem> choices
) {
    public record ChoiceItem(
        String key,
        String kind,
        String body,
        int sortOrder
    ) {}
}
