package com.passql.meta.repository;

import com.passql.meta.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {
    Optional<Subtopic> findByCode(String code);
    List<Subtopic> findByTopicUuidOrderBySortOrderAsc(UUID topicUuid);
    List<Subtopic> findByIsActiveTrueOrderBySortOrderAsc();
}
