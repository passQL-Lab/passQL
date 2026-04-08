package com.passql.meta.repository;

import com.passql.meta.entity.PromptTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, UUID> {
    Optional<PromptTemplate> findByKeyNameAndVersion(String keyName, Integer version);
    Optional<PromptTemplate> findFirstByKeyNameAndIsActiveTrueOrderByVersionDesc(String keyName);
    List<PromptTemplate> findByKeyNameOrderByVersionDesc(String keyName);
}
