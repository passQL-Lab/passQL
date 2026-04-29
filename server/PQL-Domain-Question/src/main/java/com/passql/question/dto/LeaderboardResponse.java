package com.passql.question.dto;

import java.time.LocalDate;
import java.util.List;

public record LeaderboardResponse(
    LocalDate date,
    List<LeaderboardEntry> entries,
    LeaderboardEntry myEntry
) {}
