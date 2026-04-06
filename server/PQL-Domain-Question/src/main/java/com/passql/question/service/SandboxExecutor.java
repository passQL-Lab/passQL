package com.passql.question.service;

import com.passql.meta.service.AppSettingService;
import com.passql.question.dto.ExecuteResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SandboxExecutor {
    private final AppSettingService appSettingService;

    public ExecuteResult execute(Long questionId, String sql) {
        // TODO: sandbox DataSource로 실행
        throw new UnsupportedOperationException("TODO");
    }
}
