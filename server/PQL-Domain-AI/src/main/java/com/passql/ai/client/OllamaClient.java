package com.passql.ai.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class OllamaClient {
    private final RestClient restClient;

    public OllamaClient(
            @Value("${ollama.base-url}") String baseUrl,
            @Value("${ollama.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }

    public String chat(String model, String systemPrompt, String userPrompt, float temperature, int maxTokens) {
        // TODO: POST /api/chat
        throw new UnsupportedOperationException("TODO");
    }

    public float[] embed(String model, String text) {
        // TODO: POST /api/embed
        throw new UnsupportedOperationException("TODO");
    }
}
