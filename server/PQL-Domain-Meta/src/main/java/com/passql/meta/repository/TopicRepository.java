package com.passql.meta.repository;

import com.passql.meta.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {
    Optional<Topic> findByCode(String code);
    List<Topic> findByIsActiveTrueOrderBySortOrderAsc();
    List<Topic> findAllByOrderBySortOrderAsc();
    boolean existsByCode(String code);
}
