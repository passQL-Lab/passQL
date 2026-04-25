package com.passql.meta.repository;

import com.passql.meta.constant.LegalType;
import com.passql.meta.entity.Legal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LegalRepository extends JpaRepository<Legal, UUID> {
    Optional<Legal> findByType(LegalType type);
    List<Legal> findAllByOrderByTypeAsc();
}
