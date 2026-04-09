package com.passql.question.service;

import com.passql.ai.dto.GeneratedChoiceDto;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.ValidationReport;
import com.passql.question.dto.ValidationReport.ChoiceValidation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * AI 생성 선택지를 샌드박스에서 실행하여 정답 여부를 검증한다.
 * <p>
 * 플로우:
 * 1. SandboxPool.acquire() → 임시 DB 획득
 * 2. DDL + sample data 적용
 * 3. answerSql 실행 → expected result set
 * 4. 각 choice.body 실행 → actual vs expected 비교 (정렬 무시, set 비교)
 * 5. ValidationReport 반환
 * 6. finally: SandboxPool.release()
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SandboxValidator {

    private final SandboxPool sandboxPool;
    private final SandboxExecutor sandboxExecutor;

    /**
     * 선택지들을 샌드박스에서 실행하여 검증한다.
     *
     * @param choices        AI 생성 선택지 목록
     * @param answerSql      기준 정답 SQL
     * @param schemaDdl      DDL
     * @param schemaSampleData 샘플 INSERT
     * @return 검증 결과
     */
    public ValidationReport validate(
            List<GeneratedChoiceDto> choices,
            String answerSql,
            String schemaDdl,
            String schemaSampleData
    ) {
        String dbName = sandboxPool.acquire();
        try {
            // 1. 스키마 + 샘플 데이터 적용
            String setupSql = schemaDdl;
            if (schemaSampleData != null && !schemaSampleData.isBlank()) {
                setupSql = setupSql + ";\n" + schemaSampleData;
            }
            sandboxExecutor.applyDdl(dbName, setupSql);

            // 2. 정답 SQL 실행 → expected
            ExecuteResult expected = sandboxExecutor.execute(dbName, answerSql);
            if (!"OK".equals(expected.status())) {
                throw new CustomException(ErrorCode.SANDBOX_ANSWER_SQL_FAILED,
                        "기준 정답 SQL 실행 실패: " + expected.errorMessage());
            }

            // 3. 각 선택지 실행 + 비교
            List<ChoiceValidation> validations = new ArrayList<>();
            int correctCount = 0;

            for (GeneratedChoiceDto choice : choices) {
                ExecuteResult actual = sandboxExecutor.execute(dbName, choice.body());
                boolean matches = false;
                if ("OK".equals(actual.status())) {
                    matches = resultSetsMatch(expected, actual);
                }
                if (matches) {
                    correctCount++;
                }
                validations.add(new ChoiceValidation(
                        choice.key(),
                        actual.status(),
                        actual.rows(),
                        actual.elapsedMs(),
                        matches,
                        actual.errorMessage()
                ));
            }

            return new ValidationReport(correctCount, validations);
        } finally {
            sandboxPool.release(dbName);
        }
    }

    /**
     * 두 결과셋을 정렬 무시하고 set 비교한다.
     */
    private boolean resultSetsMatch(ExecuteResult expected, ExecuteResult actual) {
        if (!expected.columns().equals(actual.columns())) {
            return false;
        }
        // row 를 set 으로 비교 (정렬 무시)
        Set<List<Object>> expectedSet = new HashSet<>(expected.rows());
        Set<List<Object>> actualSet = new HashSet<>(actual.rows());
        return expectedSet.equals(actualSet);
    }
}
