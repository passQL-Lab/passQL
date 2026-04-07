package com.passql.submission.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "execution_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExecutionLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userUuid;
    private Long questionId;
    private String choiceKey;
    @Column(columnDefinition = "TEXT") private String sqlText;
    private String status;
    private String errorCode;
    private String errorMessage;
    private Integer rowCount;
    private Long elapsedMs;
    private LocalDateTime executedAt;
}
