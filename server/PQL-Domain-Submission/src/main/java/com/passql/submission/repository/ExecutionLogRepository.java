package com.passql.submission.repository;

import com.passql.submission.entity.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long> {
    List<ExecutionLog> findTop20ByOrderByExecutedAtDesc();
}
