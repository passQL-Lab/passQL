package com.passql.question.dto;

import java.util.List;

public record ExecuteResult(
    String status, List<String> columns, List<List<Object>> rows,
    int rowCount, long elapsedMs, String errorCode, String errorMessage
) {}
