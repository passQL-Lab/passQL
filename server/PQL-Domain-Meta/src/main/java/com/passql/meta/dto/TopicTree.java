package com.passql.meta.dto;

import java.util.List;

public record TopicTree(String code, String displayName, List<SubtopicItem> subtopics) {
    public record SubtopicItem(String code, String displayName) {}
}
