package com.passql.submission.repository;

import com.passql.submission.entity.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, UUID> {

    List<ExecutionLog> findTop20ByOrderByExecutedAtDesc();

    List<ExecutionLog> findByExecutedAtAfter(LocalDateTime since);

    List<ExecutionLog> findByMemberUuidOrderByExecutedAtDesc(UUID memberUuid);

    List<ExecutionLog> findByQuestionUuidOrderByExecutedAtDesc(UUID questionUuid);
}
