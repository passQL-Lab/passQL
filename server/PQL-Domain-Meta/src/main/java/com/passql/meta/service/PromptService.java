package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.repository.PromptTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PromptService {
    private final PromptTemplateRepository promptTemplateRepository;

    @Cacheable(value = "prompts", key = "#keyName")
    public PromptTemplate getActivePrompt(String keyName) {
        return promptTemplateRepository.findByKeyNameAndIsActiveTrue(keyName)
                .orElseThrow(() -> new CustomException(ErrorCode.PROMPT_NOT_FOUND));
    }
}
