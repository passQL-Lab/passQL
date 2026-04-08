package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SqlSafetyValidator {
    private final AppSettingService appSettingService;

    public void validate(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String trimmed = sql.strip().toUpperCase();

        // SELECT 또는 WITH 구문만 허용
        if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
            throw new CustomException(ErrorCode.NOT_SELECT);
        }

        // 다중 문장 금지 (세미콜론 기준 단순 검사)
        String withoutStrings = trimmed.replaceAll("'[^']*'", "''");
        long stmtCount = java.util.Arrays.stream(withoutStrings.split(";"))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .count();
        if (stmtCount > 1) {
            throw new CustomException(ErrorCode.MULTIPLE_STATEMENTS);
        }

        // 최대 길이 제한 (app_setting에서 읽되, 실패 시 기본값 2000 사용)
        int maxLength;
        try {
            maxLength = appSettingService.getInt("sandbox.sql_max_length");
        } catch (Exception e) {
            maxLength = 2000;
        }
        if (sql.length() > maxLength) {
            throw new CustomException(ErrorCode.TOO_LONG);
        }
    }
}
