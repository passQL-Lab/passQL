package com.passql.meta.repository;

import com.passql.meta.entity.PromptTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, Long> {
    Optional<PromptTemplate> findByKeyNameAndIsActiveTrue(String keyName);
}
