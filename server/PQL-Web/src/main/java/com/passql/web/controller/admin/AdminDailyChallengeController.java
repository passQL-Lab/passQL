package com.passql.web.controller.admin;

import com.passql.question.dto.DailyChallengeAssignRequest;
import com.passql.question.dto.DailyChallengeItem;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.service.AdminDailyChallengeService;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/admin/daily-challenges")
@RequiredArgsConstructor
public class AdminDailyChallengeController {

    private final AdminDailyChallengeService adminDailyChallengeService;
    private final QuestionService questionService;

    /** 어드민 화면 */
    @GetMapping
    public String page(Model model) {
        List<QuestionSummary> activeQuestions = questionService
                .getQuestions(null, null, null, null,
                        PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();
        model.addAttribute("activeQuestions", activeQuestions);
        model.addAttribute("pageTitle", "일일 챌린지 관리");
        model.addAttribute("currentMenu", "daily-challenges");
        return "admin/daily-challenges";
    }

    /** 캘린더 데이터 조회 */
    @GetMapping("/api")
    @ResponseBody
    public ResponseEntity<List<DailyChallengeItem>> getChallenges(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(adminDailyChallengeService.getChallenges(from, to));
    }

    /** 날짜에 10문제 자동 배정 (questionUuids 없으면 폴백 로직으로 자동 선정) */
    @PutMapping("/{date}")
    @ResponseBody
    public ResponseEntity<?> assign(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody DailyChallengeAssignRequest request) {
        if (request.questionUuids() == null || request.questionUuids().isEmpty()) {
            adminDailyChallengeService.confirmFallback(date);
            return ResponseEntity.ok(adminDailyChallengeService.getChallenges(date, date));
        }
        return ResponseEntity.ok(adminDailyChallengeService.assign(date, request.questionUuids()));
    }

    /** 배정 해제 */
    @DeleteMapping("/{date}")
    @ResponseBody
    public ResponseEntity<Void> unassign(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        adminDailyChallengeService.unassign(date);
        return ResponseEntity.ok().build();
    }
}
