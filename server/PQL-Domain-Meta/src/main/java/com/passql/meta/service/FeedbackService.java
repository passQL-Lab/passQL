package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.dto.FeedbackAdminResponse;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.entity.Feedback;
import com.passql.meta.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Transactional
    public FeedbackSubmitResponse submit(UUID memberUuid, FeedbackSubmitRequest request) {
        String content = request.getContent();

        if (content == null || content.isBlank()) {
            throw new CustomException(ErrorCode.FEEDBACK_CONTENT_EMPTY);
        }

        String trimmed = content.trim();

        if (trimmed.length() > 500) {
            throw new CustomException(ErrorCode.FEEDBACK_CONTENT_TOO_LONG);
        }

        Feedback feedback = Feedback.builder()
            .memberUuid(memberUuid)
            .content(trimmed)
            .status(FeedbackStatus.PENDING)
            .build();

        Feedback saved = feedbackRepository.save(feedback);
        log.info("[FeedbackService] 건의사항 제출 완료: feedbackUuid={}, memberUuid={}", saved.getFeedbackUuid(), memberUuid);
        return FeedbackSubmitResponse.from(saved);
    }

    public FeedbackListResponse getMyFeedbacks(UUID memberUuid) {
        List<Feedback> feedbacks = feedbackRepository.findByMemberUuidOrderByCreatedAtDesc(memberUuid);
        return FeedbackListResponse.of(feedbacks);
    }

    public Page<FeedbackAdminResponse> getAllFeedbacks(Pageable pageable) {
        return feedbackRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(FeedbackAdminResponse::from);
    }

    public long countByStatus(FeedbackStatus status) {
        return feedbackRepository.countByStatus(status);
    }

    @Transactional
    public void updateStatus(UUID feedbackUuid, FeedbackStatus status) {
        Feedback feedback = feedbackRepository.findById(feedbackUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.FEEDBACK_NOT_FOUND));
        feedback.setStatus(status);
        log.info("[FeedbackService] 건의사항 상태 변경: feedbackUuid={}, status={}", feedbackUuid, status);
    }
}
