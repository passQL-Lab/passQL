package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackListResponse {

    private List<FeedbackItem> items;

    @Getter
    @AllArgsConstructor
    public static class FeedbackItem {
        private UUID feedbackUuid;
        private String content;
        private String status;
        private LocalDateTime createdAt;

        public static FeedbackItem from(Feedback f) {
            return new FeedbackItem(
                f.getFeedbackUuid(),
                f.getContent(),
                f.getStatus().name(),
                f.getCreatedAt()
            );
        }
    }

    public static FeedbackListResponse of(List<Feedback> feedbacks) {
        List<FeedbackItem> items = feedbacks.stream()
            .map(FeedbackItem::from)
            .toList();
        return new FeedbackListResponse(items);
    }
}
