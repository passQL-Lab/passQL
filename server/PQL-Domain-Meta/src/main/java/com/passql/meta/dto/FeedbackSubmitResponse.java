package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackSubmitResponse {

    private UUID feedbackUuid;
    private String status;
    private LocalDateTime createdAt;

    public static FeedbackSubmitResponse from(Feedback f) {
        return new FeedbackSubmitResponse(
            f.getFeedbackUuid(),
            f.getStatus().name(),
            f.getCreatedAt()
        );
    }
}
