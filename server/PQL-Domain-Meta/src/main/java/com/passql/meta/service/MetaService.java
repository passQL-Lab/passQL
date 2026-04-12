package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.dto.TopicTree;
import com.passql.meta.dto.TopicUpdateRequest;
import com.passql.meta.entity.ConceptDoc;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.ConceptDocRepository;
import com.passql.meta.repository.ConceptTagRepository;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetaService {

    private static final String EMBEDDING_VERSION = "v1";
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ConceptTagRepository conceptTagRepository;
    private final ConceptDocRepository conceptDocRepository;

    public List<TopicTree> getTopicTree() {
        // 관리자 화면에서는 비활성 토픽도 포함해 전체 목록을 표시 (비활성화 후 되돌릴 수 없는 문제 방지)
        List<Topic> topics = topicRepository.findAllByOrderBySortOrderAsc();
        return topics.stream()
                .map(topic -> {
                    List<TopicTree.SubtopicItem> subs = subtopicRepository
                            .findByTopicUuidOrderBySortOrderAsc(topic.getTopicUuid())
                            .stream()
                            .map(s -> new TopicTree.SubtopicItem(s.getCode(), s.getDisplayName(), s.getSortOrder(), s.getIsActive()))
                            .toList();
                    return new TopicTree(topic.getTopicUuid(), topic.getCode(), topic.getDisplayName(), topic.getSortOrder(), topic.getIsActive(), subs);
                })
                .toList();
    }

    public List<ConceptTag> getActiveTags() {
        return conceptTagRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    public List<Subtopic> getSubtopics(String topicCode) {
        return topicRepository.findByCode(topicCode)
                .map(topic -> subtopicRepository.findByTopicUuidOrderBySortOrderAsc(topic.getTopicUuid()))
                .orElse(List.of());
    }

    public List<ConceptDoc> getDocsByTagKey(String tagKey) {
        return conceptTagRepository.findByTagKey(tagKey)
                .map(tag -> conceptDocRepository.findByConceptTagUuid(tag.getConceptTagUuid()))
                .orElse(List.of());
    }

    @Transactional
    public ConceptDoc createDoc(String tagKey, String title, String bodyMd) {
        ConceptTag tag = conceptTagRepository.findByTagKey(tagKey)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 tagKey: " + tagKey));
        ConceptDoc doc = ConceptDoc.builder()
                .conceptTagUuid(tag.getConceptTagUuid())
                .title(title)
                .bodyMd(bodyMd)
                .embeddingVersion(EMBEDDING_VERSION)
                .isActive(true)
                .build();
        return conceptDocRepository.save(doc);
    }

    /** 토픽 편집 — displayName, sortOrder, isActive 수정 */
    @Transactional
    public void updateTopic(String code, TopicUpdateRequest request) {
        Topic topic = topicRepository.findByCode(code)
                .orElseThrow(() -> new CustomException(ErrorCode.TOPIC_NOT_FOUND));
        topic.setDisplayName(request.displayName());
        topic.setSortOrder(request.sortOrder());
        topic.setIsActive(request.isActive());
    }

    @Transactional
    public void updateDocBody(UUID conceptDocUuid, String bodyMd) {
        ConceptDoc doc = conceptDocRepository.findById(conceptDocUuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 ConceptDoc: " + conceptDocUuid));
        doc.setBodyMd(bodyMd);
    }
}
