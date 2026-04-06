package com.passql.meta.repository;

import com.passql.meta.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TopicRepository extends JpaRepository<Topic, String> {
    List<Topic> findByIsActiveTrueOrderBySortOrder();
}
