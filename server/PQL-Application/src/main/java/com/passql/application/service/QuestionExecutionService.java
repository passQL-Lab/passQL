package com.passql.application.service;

import com.passql.ai.service.AiService;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.service.QuestionService;
import com.passql.question.service.SandboxExecutor;
import com.passql.question.service.SqlSafetyValidator;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 크로스 도메인 서비스 - 문제 실행 흐름 (Question + Sandbox + AI + Submission)
 */
@Service
@RequiredArgsConstructor
public class QuestionExecutionService {
    private final QuestionService questionService;
    private final SqlSafetyValidator sqlSafetyValidator;
    private final SandboxExecutor sandboxExecutor;
    private final AiService aiService;
    private final SubmissionService submissionService;

    public ExecuteResult executeChoice(UUID questionUuid, String choiceKey, UUID memberUuid) {
        // TODO: 1. SQL 안전성 검증 2. sandbox 실행 3. 로그 저장
        throw new UnsupportedOperationException("TODO");
    }
}
