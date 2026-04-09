package com.passql.ai.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.types.Schema;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Python AI 서버 장애 시 GeminiClient 를 직접 호출하는 fallback 래퍼.
 * <p>
 * ⚠️ AiGatewayClient 내부에서만 호출. 다른 서비스에서 직접 주입 금지.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiFallbackClient {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GenerateQuestionFullResult generateQuestionFull(GenerateQuestionFullRequest request) {
        LlmConfigDto cfg = request.llmConfig();
        String userPrompt = renderTemplate(cfg.userTemplate(), buildQuestionFullVars(request.context()));
        try {
            long started = System.currentTimeMillis();
            String json;
            if (cfg.responseSchema() != null) {
                json = geminiClient.chatStructured(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens(),
                        convertSchema(cfg.responseSchema()));
            } else {
                json = geminiClient.chat(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens());
            }
            int elapsed = (int) (System.currentTimeMillis() - started);
            return parseQuestionFullResponse(json, cfg.model(), elapsed);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GeminiFallback] generateQuestionFull 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.AI_FALLBACK_FAILED,
                    "Gemini 직접 호출 실패: " + e.getMessage());
        }
    }

    public GenerateChoiceSetResult generateChoiceSet(GenerateChoiceSetRequest request) {
        LlmConfigDto cfg = request.llmConfig();
        String userPrompt = renderTemplate(cfg.userTemplate(), buildChoiceSetVars(request.context()));
        try {
            long started = System.currentTimeMillis();
            String json;
            if (cfg.responseSchema() != null) {
                json = geminiClient.chatStructured(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens(),
                        convertSchema(cfg.responseSchema()));
            } else {
                json = geminiClient.chat(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens());
            }
            int elapsed = (int) (System.currentTimeMillis() - started);
            return parseChoiceSetResponse(json, cfg.model(), elapsed);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GeminiFallback] generateChoiceSet 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.AI_FALLBACK_FAILED,
                    "Gemini 직접 호출 실패: " + e.getMessage());
        }
    }

    public TestPromptResult testPrompt(TestPromptRequest request) {
        LlmConfigDto cfg = request.llmConfig();
        String userPrompt = renderTemplate(cfg.userTemplate(), request.variables());
        try {
            long started = System.currentTimeMillis();
            String result;
            if (cfg.responseSchema() != null) {
                result = geminiClient.chatStructured(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens(),
                        convertSchema(cfg.responseSchema()));
            } else {
                result = geminiClient.chat(
                        cfg.model(), cfg.systemPrompt(), userPrompt,
                        cfg.temperature(), cfg.maxTokens());
            }
            int elapsed = (int) (System.currentTimeMillis() - started);
            return new TestPromptResult(result, elapsed);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[GeminiFallback] testPrompt 실패: {}", e.getMessage());
            throw new CustomException(ErrorCode.AI_FALLBACK_FAILED,
                    "Gemini 직접 호출 실패: " + e.getMessage());
        }
    }

    // ========================
    //  내부 유틸
    // ========================

    private String renderTemplate(String template, Map<String, String> variables) {
        if (template == null) return "";
        String rendered = template;
        for (var entry : variables.entrySet()) {
            rendered = rendered.replace("{" + entry.getKey() + "}",
                    entry.getValue() != null ? entry.getValue() : "");
        }
        return rendered;
    }

    private Map<String, String> buildQuestionFullVars(QuestionFullContextDto ctx) {
        return Map.of(
                "schema_ddl", ctx.schemaDdl() != null ? ctx.schemaDdl() : "",
                "schema_sample_data", ctx.schemaSampleData() != null ? ctx.schemaSampleData() : "",
                "schema_intent", ctx.schemaIntent() != null ? ctx.schemaIntent() : "",
                "topic", ctx.topic() != null ? ctx.topic() : "",
                "subtopic", ctx.subtopic() != null ? ctx.subtopic() : "",
                "difficulty", String.valueOf(ctx.difficulty()),
                "hint", ctx.hint() != null ? ctx.hint() : ""
        );
    }

    private Map<String, String> buildChoiceSetVars(ChoiceSetContextDto ctx) {
        return Map.of(
                "question_uuid", ctx.questionUuid() != null ? ctx.questionUuid().toString() : "",
                "stem", ctx.stem() != null ? ctx.stem() : "",
                "answer_sql", ctx.answerSql() != null ? ctx.answerSql() : "",
                "schema_ddl", ctx.schemaDdl() != null ? ctx.schemaDdl() : "",
                "schema_sample_data", ctx.schemaSampleData() != null ? ctx.schemaSampleData() : "",
                "schema_intent", ctx.schemaIntent() != null ? ctx.schemaIntent() : "",
                "difficulty", String.valueOf(ctx.difficulty())
        );
    }

    private Schema convertSchema(Map<String, Object> schemaMap) {
        // google-genai SDK Schema 변환 — MVP 에서는 Gemini의 JSON mode 활용
        // 상세 변환은 Schema.builder() 로 해야 하나, 실질적으로 responseMimeType=json 사용 시
        // 타입 힌트로 충분. 여기서는 단순 변환.
        try {
            String json = objectMapper.writeValueAsString(schemaMap);
            return Schema.fromJson(json);
        } catch (Exception e) {
            log.warn("[GeminiFallback] Schema 변환 실패, null 사용: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private GenerateQuestionFullResult parseQuestionFullResponse(String json, String model, int elapsed) {
        try {
            Map<String, Object> payload = objectMapper.readValue(json, new TypeReference<>() {});
            String stem = (String) payload.get("stem");
            String answerSql = (String) payload.get("answer_sql");
            List<Map<String, Object>> rawChoices = (List<Map<String, Object>>) payload.get("seed_choices");

            List<GeneratedChoiceDto> choices = rawChoices.stream()
                    .map(c -> new GeneratedChoiceDto(
                            (String) c.get("key"),
                            (String) c.get("body"),
                            Boolean.TRUE.equals(c.get("is_correct")),
                            (String) c.get("rationale")))
                    .toList();

            return new GenerateQuestionFullResult(stem, answerSql, choices,
                    new GenerationMetadataDto(model, null, elapsed, null, null, payload, 1));
        } catch (Exception e) {
            throw new CustomException(ErrorCode.AI_RESPONSE_PARSE_FAILED,
                    "Gemini fallback 응답 파싱 실패: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private GenerateChoiceSetResult parseChoiceSetResponse(String json, String model, int elapsed) {
        try {
            Map<String, Object> payload = objectMapper.readValue(json, new TypeReference<>() {});
            List<Map<String, Object>> rawChoices = (List<Map<String, Object>>) payload.get("choices");

            List<GeneratedChoiceDto> choices = rawChoices.stream()
                    .map(c -> new GeneratedChoiceDto(
                            (String) c.get("key"),
                            (String) c.get("body"),
                            Boolean.TRUE.equals(c.get("is_correct")),
                            (String) c.get("rationale")))
                    .toList();

            return new GenerateChoiceSetResult(choices,
                    new GenerationMetadataDto(model, null, elapsed, null, null, payload, 1));
        } catch (Exception e) {
            throw new CustomException(ErrorCode.AI_RESPONSE_PARSE_FAILED,
                    "Gemini fallback 응답 파싱 실패: " + e.getMessage());
        }
    }
}
