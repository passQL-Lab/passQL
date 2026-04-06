package com.passql.question.service;

import com.passql.meta.service.AppSettingService;
import com.passql.question.exception.SqlSafetyException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SqlSafetyValidator {
    private final AppSettingService appSettingService;

    public void validate(String sql) {
        // TODO: SELECT/WITH만 허용, 단일 문, 길이 제한
        throw new UnsupportedOperationException("TODO");
    }
}
