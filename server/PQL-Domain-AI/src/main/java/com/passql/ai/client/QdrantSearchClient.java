package com.passql.ai.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.List;

@Slf4j
@Component
public class QdrantSearchClient {
    private final String baseUrl;
    private final String collection;

    public QdrantSearchClient(
            @Value("${qdrant.base-url}") String baseUrl,
            @Value("${qdrant.collection}") String collection
    ) {
        this.baseUrl = baseUrl;
        this.collection = collection;
    }

    public List<Long> searchSimilar(float[] vector, int topK) {
        // TODO: POST /collections/{collection}/points/search
        throw new UnsupportedOperationException("TODO");
    }
}
