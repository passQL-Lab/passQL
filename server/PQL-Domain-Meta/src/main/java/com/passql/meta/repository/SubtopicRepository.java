package com.passql.meta.repository;

import com.passql.meta.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubtopicRepository extends JpaRepository<Subtopic, String> {
    List<Subtopic> findByTopicCodeAndIsActiveTrueOrderBySortOrder(String topicCode);
}
