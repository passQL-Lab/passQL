package com.passql.meta.repository;

import com.passql.meta.entity.ConceptTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConceptTagRepository extends JpaRepository<ConceptTag, String> {
    List<ConceptTag> findByIsActiveTrueOrderBySortOrder();
}
