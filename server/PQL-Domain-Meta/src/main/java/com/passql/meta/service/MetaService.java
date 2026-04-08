package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetaService {
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ConceptTagRepository conceptTagRepository;
    private final ExamScheduleRepository examScheduleRepository;

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

    public List<ExamSchedule> getAllExamSchedules() {
        return examScheduleRepository.findAllByOrderByCertTypeAscRoundAsc();
    }

    public Optional<ExamSchedule> getSelectedExamSchedule() {
        return examScheduleRepository.findFirstByIsSelectedTrue();
    }

    @Transactional
    public ExamSchedule selectExamSchedule(UUID examScheduleUuid) {
        ExamSchedule target = examScheduleRepository.findById(examScheduleUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));
        examScheduleRepository.findAll().forEach(s -> {
            if (Boolean.TRUE.equals(s.getIsSelected())) {
                s.setIsSelected(false);
            }
        });
        target.setIsSelected(true);
        return target;
    }
}
