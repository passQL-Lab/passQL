package com.passql.meta.repository;

import com.passql.meta.constant.CertType;
import com.passql.meta.entity.ExamSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, UUID> {
    List<ExamSchedule> findAllByOrderByCertTypeAscRoundAsc();
    List<ExamSchedule> findByCertTypeOrderByRoundAsc(CertType certType);
    Optional<ExamSchedule> findFirstByIsSelectedTrue();
    Optional<ExamSchedule> findByCertTypeAndRound(CertType certType, Integer round);
}
