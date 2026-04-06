package com.passql.submission.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submission")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Submission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userUuid;
    @Column(name = "question_id")
    private Long questionId;
    private String selectedKey;
    private Boolean isCorrect;
    private LocalDateTime submittedAt;
}
