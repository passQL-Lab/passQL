package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleCreateRequest;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamScheduleService {

    private final ExamScheduleRepository examScheduleRepository;

    public List<ExamScheduleResponse> getSchedulesByCertType(CertType certType) {
        return examScheduleRepository.findByCertTypeOrderByRoundAsc(certType).stream()
                .map(ExamScheduleResponse::from)
                .toList();
    }

    public ExamScheduleResponse getSelectedSchedule() {
        return examScheduleRepository.findFirstByIsSelectedTrue()
                .map(ExamScheduleResponse::from)
                .orElse(null);
    }

    public List<ExamScheduleResponse> getAllSchedules(CertType certType) {
        if (certType == null) {
            return examScheduleRepository.findAllByOrderByCertTypeAscRoundAsc().stream()
                    .map(ExamScheduleResponse::from)
                    .toList();
        }
        return getSchedulesByCertType(certType);
    }

    @Transactional
    public ExamScheduleResponse createSchedule(ExamScheduleCreateRequest request) {
        CertType certType = CertType.valueOf(request.getCertType());

        if (examScheduleRepository.existsByCertTypeAndRound(certType, request.getRound())) {
            throw new CustomException(ErrorCode.EXAM_SCHEDULE_DUPLICATE);
        }

        ExamSchedule schedule = ExamSchedule.builder()
                .certType(certType)
                .round(request.getRound())
                .examDate(request.getExamDate())
                .isSelected(false)
                .build();

        ExamSchedule saved = examScheduleRepository.save(schedule);
        return ExamScheduleResponse.from(saved);
    }

    @Transactional
    public void selectSchedule(UUID examScheduleUuid) {
        ExamSchedule target = examScheduleRepository.findById(examScheduleUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));

        examScheduleRepository.findFirstByIsSelectedTrue()
                .ifPresent(current -> current.setIsSelected(false));

        target.setIsSelected(true);
    }

    @Transactional
    public void deleteSchedule(UUID examScheduleUuid) {
        ExamSchedule schedule = examScheduleRepository.findById(examScheduleUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));

        examScheduleRepository.delete(schedule);
    }
}
