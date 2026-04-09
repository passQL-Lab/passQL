package com.passql.ai.dto;

/**
 * 관리자 문제 등록 시 전체 문제(stem+answer_sql+seed) 생성에 필요한 컨텍스트.
 */
public record QuestionFullContextDto(
        String schemaDdl,
        String schemaSampleData,
        String schemaIntent,
        String topic,
        String subtopic,
        int difficulty,
        String hint
) {}
