package com.passql.meta.repository;

import com.passql.meta.entity.ConceptDoc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConceptDocRepository extends JpaRepository<ConceptDoc, UUID> {
    List<ConceptDoc> findByConceptTagUuid(UUID conceptTagUuid);
}
