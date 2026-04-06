package com.passql.question.entity;

import com.passql.question.constant.ChoiceKind;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "question_choice")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionChoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long questionId;
    private String choiceKey;
    @Enumerated(EnumType.STRING) private ChoiceKind kind;
    @Column(columnDefinition = "TEXT") private String body;
    private Boolean isCorrect;
    @Column(columnDefinition = "TEXT") private String rationale;
    private Integer sortOrder;
}
