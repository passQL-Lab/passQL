package com.passql.web.controller;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MetaController implements MetaControllerDocs {

    private final MetaService metaService;

    @GetMapping("/meta/topics")
    public ResponseEntity<List<TopicTree>> getTopics() {
        return ResponseEntity.ok(metaService.getTopicTree());
    }

    @GetMapping("/meta/tags")
    public ResponseEntity<List<ConceptTag>> getTags() {
        return ResponseEntity.ok(metaService.getActiveTags());
    }

    @GetMapping("/exam-schedules")
    public ResponseEntity<List<ExamSchedule>> getExamSchedules() {
        return ResponseEntity.ok(metaService.getAllExamSchedules());
    }

    @GetMapping("/exam-schedules/selected")
    public ResponseEntity<ExamSchedule> getSelectedExamSchedule() {
        ExamSchedule selected = metaService.getSelectedExamSchedule()
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));
        return ResponseEntity.ok(selected);
    }

    @PutMapping("/exam-schedules/{uuid}/select")
    public ResponseEntity<ExamSchedule> selectExamSchedule(@PathVariable("uuid") UUID uuid) {
        return ResponseEntity.ok(metaService.selectExamSchedule(uuid));
    }
}
