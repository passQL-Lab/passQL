package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.repository.PromptTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromptService {
    private final PromptTemplateRepository promptTemplateRepository;

    @Cacheable(value = "prompts", key = "#keyName")
    public PromptTemplate getActivePrompt(String keyName) {
        return promptTemplateRepository.findFirstByKeyNameAndIsActiveTrueOrderByVersionDesc(keyName)
                .orElseThrow(() -> new CustomException(ErrorCode.PROMPT_NOT_FOUND));
    }

    public List<PromptTemplate> findAll() {
        return promptTemplateRepository.findAll(Sort.by(Sort.Direction.ASC, "keyName"));
    }

    public Optional<PromptTemplate> findById(UUID uuid) {
        return promptTemplateRepository.findById(uuid);
    }

    @Transactional
    @CacheEvict(value = "prompts", allEntries = true)
    public PromptTemplate create(PromptTemplate template) {
        return promptTemplateRepository.save(template);
    }

    @Transactional
    @CacheEvict(value = "prompts", allEntries = true)
    public PromptTemplate update(UUID uuid, PromptTemplate form) {
        PromptTemplate existing = promptTemplateRepository.findById(uuid)
                .orElseThrow(() -> new CustomException(ErrorCode.PROMPT_NOT_FOUND));
        existing.setKeyName(form.getKeyName());
        existing.setVersion(form.getVersion());
        existing.setIsActive(form.getIsActive());
        existing.setModel(form.getModel());
        existing.setSystemPrompt(form.getSystemPrompt());
        existing.setUserTemplate(form.getUserTemplate());
        existing.setTemperature(form.getTemperature());
        existing.setMaxTokens(form.getMaxTokens());
        return promptTemplateRepository.save(existing);
    }
}
