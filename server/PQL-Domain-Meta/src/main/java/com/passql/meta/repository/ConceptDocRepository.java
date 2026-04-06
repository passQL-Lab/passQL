package com.passql.meta.repository;

import com.passql.meta.entity.ConceptDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConceptDocRepository extends JpaRepository<ConceptDoc, Long> {
    List<ConceptDoc> findByTagKeyAndIsActiveTrue(String tagKey);
}
