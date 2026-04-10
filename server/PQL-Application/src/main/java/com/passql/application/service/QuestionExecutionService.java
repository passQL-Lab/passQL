package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.SubmitResult;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoice;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.question.service.QuestionService;
import com.passql.question.service.SandboxExecutor;
import com.passql.question.service.SqlSafetyValidator;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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
    private final SubmissionService submissionService;
    private final QuestionChoiceRepository questionChoiceRepository;

    /**
     * 선택지 SQL 실행 (자유 SQL 실행에도 재사용).
     * EXECUTABLE 문제만 허용; sandboxDbName이 없으면 에러.
     */
    public ExecuteResult executeChoice(UUID questionUuid, String sql) {
        Question question = questionService.getQuestionEntity(questionUuid);
        if (question.getExecutionMode() != ExecutionMode.EXECUTABLE) {
            throw new CustomException(ErrorCode.INVALID_EXECUTION_MODE);
        }
        String dbName = question.getSandboxDbName();
        if (dbName == null || dbName.isBlank()) {
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED);
        }
        sqlSafetyValidator.validate(sql);
        return sandboxExecutor.execute(dbName, sql);
    }

    /**
     * 제출 + 실행 결과 비교.
     * EXECUTABLE: selectedKey의 SQL과 answerSql을 각각 실행하여 결과를 SubmitResult에 포함.
     * CONCEPT_ONLY: SQL 실행 없이 정답 키 비교만 수행.
     */
    public SubmitResult submitWithResult(UUID questionUuid, UUID memberUuid, String selectedChoiceKey) {
        // null/blank 선택지 키 방어
        if (selectedChoiceKey == null || selectedChoiceKey.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        Question question = questionService.getQuestionEntity(questionUuid);

        List<QuestionChoice> choices = questionChoiceRepository.findByQuestionUuidOrderBySortOrderAsc(questionUuid);
        QuestionChoice selected = choices.stream()
                .filter(c -> selectedChoiceKey.equals(c.getChoiceKey()))
                .findFirst()
                // 선택지가 존재하지 않으면 잘못된 입력 — QUESTION_NOT_FOUND가 아님
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND));
        QuestionChoice correct = choices.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsCorrect()))
                .findFirst()
                .orElse(null);

        boolean isCorrect = Boolean.TRUE.equals(selected.getIsCorrect());
        String correctKey = correct != null ? correct.getChoiceKey() : null;
        String rationale = selected.getRationale();

        // 제출 기록 저장
        submissionService.recordSubmission(memberUuid, questionUuid, selectedChoiceKey, isCorrect);

        if (question.getExecutionMode() == ExecutionMode.EXECUTABLE) {
            String dbName = question.getSandboxDbName();
            String selectedSql = selected.getBody();
            String correctSql = question.getAnswerSql();

            ExecuteResult selectedResult = null;
            ExecuteResult correctResult = null;

            if (dbName != null && !dbName.isBlank()) {
                // 제출 경로도 executeChoice와 동일하게 안전성 검증 적용
                if (selectedSql != null && !selectedSql.isBlank()) {
                    sqlSafetyValidator.validate(selectedSql);
                    selectedResult = sandboxExecutor.execute(dbName, selectedSql);
                }
                if (correctSql != null && !correctSql.isBlank()) {
                    sqlSafetyValidator.validate(correctSql);
                    correctResult = sandboxExecutor.execute(dbName, correctSql);
                }
            }

            return new SubmitResult(isCorrect, correctKey, rationale, selectedSql, correctSql, selectedResult, correctResult);
        }

        // CONCEPT_ONLY: SQL 실행 없이 반환
        return new SubmitResult(isCorrect, correctKey, rationale, null, null, null, null);
    }
}
