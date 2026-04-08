package com.passql.meta.service;

import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.ConceptTagRepository;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetaService {
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ConceptTagRepository conceptTagRepository;

    public List<TopicTree> getTopicTree() {
        List<Topic> topics = topicRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return topics.stream()
                .map(topic -> {
                    List<TopicTree.SubtopicItem> subs = subtopicRepository
                            .findByTopicUuidOrderBySortOrderAsc(topic.getTopicUuid())
                            .stream()
                            .map(s -> new TopicTree.SubtopicItem(s.getCode(), s.getDisplayName()))
                            .toList();
                    return new TopicTree(topic.getCode(), topic.getDisplayName(), subs);
                })
                .toList();
    }

    public List<ConceptTag> getActiveTags() {
        return conceptTagRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }
}
