package com.passql.submission.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SQL 실행 로그 Entity.
 */
@Entity
@Table(
    name = "execution_log",
    indexes = {
        @Index(name = "idx_execution_log_member", columnList = "member_uuid"),
        @Index(name = "idx_execution_log_question", columnList = "question_uuid"),
        @Index(name = "idx_execution_log_executed_at", columnList = "executed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExecutionLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID executionLogUuid;

    
    private UUID memberUuid;

    @Column(nullable = false)
    private UUID questionUuid;

    @Column(length = 8)
    private String choiceKey;

    @Column(columnDefinition = "TEXT")
    private String sqlText;

    @Column(length = 50)
    private String status;

    @Column(length = 100)
    private String errorCode;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private Integer rowCount;

    private Long elapsedMs;

    @Column(nullable = false)
    private LocalDateTime executedAt;
}
