package com.passql.submission.dto;

public record ProgressResponse(long solvedCount, double correctRate, int streakDays) {}
