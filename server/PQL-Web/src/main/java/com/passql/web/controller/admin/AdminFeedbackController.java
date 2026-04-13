package com.passql.web.controller.admin;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.dto.FeedbackStatusUpdateRequest;
import com.passql.meta.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/admin/feedbacks")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public String list(Model model,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedPage = Math.max(0, page);
        int clampedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, Sort.unsorted()); // 정렬은 findAllByOrderByCreatedAtDesc 메서드명에서 처리

        var statusCounts = feedbackService.countByStatus();
        model.addAttribute("feedbacks", feedbackService.getAllFeedbacks(pageable));
        model.addAttribute("statuses", FeedbackStatus.values());
        model.addAttribute("pendingCount", statusCounts.get(FeedbackStatus.PENDING));
        model.addAttribute("reviewedCount", statusCounts.get(FeedbackStatus.REVIEWED));
        model.addAttribute("appliedCount", statusCounts.get(FeedbackStatus.APPLIED));
        model.addAttribute("pageTitle", "건의사항 관리");
        model.addAttribute("currentMenu", "feedbacks");
        return "admin/feedbacks";
    }

    @PostMapping("/{feedbackUuid}/status")
    @ResponseBody
    public ResponseEntity<Void> updateStatus(@PathVariable UUID feedbackUuid,
                                              @RequestBody FeedbackStatusUpdateRequest request) {
        FeedbackStatus status;
        try {
            status = FeedbackStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }
        feedbackService.updateStatus(feedbackUuid, status);
        return ResponseEntity.ok().build();
    }
}
