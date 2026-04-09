package com.passql.meta.dto;

import java.util.List;
import java.util.UUID;

public record TopicTree(UUID topicUuid, String code, String displayName, Integer sortOrder, Boolean isActive, List<SubtopicItem> subtopics) {
    public record SubtopicItem(String code, String displayName, Integer sortOrder, Boolean isActive) {}
}
