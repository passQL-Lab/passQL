package com.passql.ai.dto;

import java.util.UUID;

/**
 * 기존 문제에 대해 선택지 4개 세트를 생성할 때 필요한 컨텍스트.
 */
public record ChoiceSetContextDto(
        UUID questionUuid,
        String stem,
        String answerSql,
        String schemaDdl,
        String schemaSampleData,
        String schemaIntent,
        int difficulty
) {}
