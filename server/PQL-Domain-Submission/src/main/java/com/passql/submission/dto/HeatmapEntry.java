package com.passql.submission.dto;

import java.time.LocalDate;

public record HeatmapEntry(
    LocalDate date,
    int solvedCount,
    int correctCount
) {}
