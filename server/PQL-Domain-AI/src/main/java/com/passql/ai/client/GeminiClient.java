package com.passql.ai.client;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class GeminiClient {

    private final Client client;
    private final String defaultModel;

    public GeminiClient(
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.model}") String defaultModel
    ) {
        this.client = Client.builder().apiKey(apiKey).build();
        this.defaultModel = defaultModel;
    }

    /**
     * 일반 텍스트 응답
     */
    public String chat(String systemPrompt, String userPrompt, float temperature, int maxTokens) {
        return chat(defaultModel, systemPrompt, userPrompt, temperature, maxTokens);
    }

    /**
     * 일반 텍스트 응답 (모델 명시)
     */
    public String chat(String model, String systemPrompt, String userPrompt, float temperature, int maxTokens) {
        log.debug("Gemini chat: model={}, maxTokens={}", model, maxTokens);

        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                .temperature(temperature)
                .maxOutputTokens(maxTokens)
                .build();

        GenerateContentResponse response = client.models.generateContent(model, userPrompt, config);
        return extractText(response, model);
    }

    /**
     * JSON 강제 응답 (responseSchema 지정)
     */
    public String chatStructured(String systemPrompt, String userPrompt, float temperature, int maxTokens, Schema responseSchema) {
        return chatStructured(defaultModel, systemPrompt, userPrompt, temperature, maxTokens, responseSchema);
    }

    /**
     * JSON 강제 응답 (모델 명시 + responseSchema 지정)
     */
    public String chatStructured(String model, String systemPrompt, String userPrompt, float temperature, int maxTokens, Schema responseSchema) {
        log.debug("Gemini chatStructured: model={}, maxTokens={}", model, maxTokens);

        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                .temperature(temperature)
                .maxOutputTokens(maxTokens)
                .responseMimeType("application/json")
                .responseSchema(responseSchema)
                .build();

        GenerateContentResponse response = client.models.generateContent(model, userPrompt, config);
        return extractText(response, model);
    }

    private String extractText(GenerateContentResponse response, String model) {
        String text = response.text();
        if (text == null || text.isBlank()) {
            throw new IllegalStateException("Gemini returned empty response for model: " + model);
        }
        return text;
    }
}
