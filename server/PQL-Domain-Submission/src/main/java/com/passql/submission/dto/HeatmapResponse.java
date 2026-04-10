package com.passql.submission.dto;

import java.util.List;

public record HeatmapResponse(
    List<HeatmapEntry> entries
) {}
