package com.passql.web.controller;

import com.passql.application.service.DailySetService;
import com.passql.application.service.HomeService;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.question.dto.DailySetCompleteRequest;
import com.passql.question.dto.DailySetCompleteResponse;
import com.passql.question.dto.DailySetTodayResponse;
import com.passql.question.dto.LeaderboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/daily-set")
@RequiredArgsConstructor
public class DailySetController {

    private final HomeService homeService;
    private final DailySetService dailySetService;

    @GetMapping("/today")
    public ResponseEntity<DailySetTodayResponse> getToday(
            @AuthMember LoginMember loginMember) {
        return ResponseEntity.ok(homeService.getToday(loginMember.memberUuid()));
    }

    @PostMapping("/complete")
    public ResponseEntity<DailySetCompleteResponse> complete(
            @AuthMember LoginMember loginMember,
            @RequestBody DailySetCompleteRequest request) {
        return ResponseEntity.ok(dailySetService.complete(loginMember.memberUuid(), request));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
            @AuthMember LoginMember loginMember) {
        return ResponseEntity.ok(dailySetService.getLeaderboard(loginMember.memberUuid()));
    }
}
