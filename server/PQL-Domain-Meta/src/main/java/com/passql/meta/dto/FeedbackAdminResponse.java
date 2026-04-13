package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackAdminResponse {

    private UUID feedbackUuid;
    private UUID memberUuid;
    private String content;
    private String status;
    private LocalDateTime createdAt;

    public static FeedbackAdminResponse from(Feedback f) {
        return new FeedbackAdminResponse(
            f.getFeedbackUuid(),
            f.getMemberUuid(),
            f.getContent(),
            f.getStatus().name(),
            f.getCreatedAt()
        );
    }
}
