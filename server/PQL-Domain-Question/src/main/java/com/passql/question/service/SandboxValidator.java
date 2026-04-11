package com.passql.question.service;

import com.passql.ai.dto.GeneratedChoiceDto;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.ChoiceSetPolicy;
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
     * policy에 따라 검증 방식이 달라진다:
     * - AI_ONLY/CURATED_ONLY/HYBRID: answerSql 결과와 일치하는 선택지 1개를 정답으로 판별
     * - ODD_ONE_OUT: 4개 실행 결과를 그룹핑하여 3:1로 나뉠 때 소수(1개) 쪽을 정답으로 판별
     *
     * @param choices          AI 생성 선택지 목록
     * @param answerSql        기준 정답 SQL (ODD_ONE_OUT에서는 검증 참고용)
     * @param schemaDdl        DDL
     * @param schemaSampleData 샘플 INSERT
     * @param policy           문제 선택지 정책
     * @return 검증 결과
     */
    public ValidationReport validate(
            List<GeneratedChoiceDto> choices,
            String answerSql,
            String schemaDdl,
            String schemaSampleData,
            ChoiceSetPolicy policy
    ) {
        // schemaDdl 없이는 sandbox 실행 불가 — 호출 전 보장되어야 하지만 방어적 체크
        if (schemaDdl == null || schemaDdl.isBlank()) {
            throw new CustomException(ErrorCode.SANDBOX_SETUP_FAILED, "스키마 DDL이 없어 샌드박스 검증을 실행할 수 없습니다.");
        }

        String dbName = sandboxPool.acquire();
        try {
            // 1. 스키마 + 샘플 데이터 적용
            String setupSql = schemaDdl;
            if (schemaSampleData != null && !schemaSampleData.isBlank()) {
                setupSql = setupSql + ";\n" + schemaSampleData;
            }
            sandboxExecutor.applyDdl(dbName, setupSql);

            if (policy == ChoiceSetPolicy.ODD_ONE_OUT) {
                return validateOddOneOut(dbName, choices);
            } else {
                return validateStandard(dbName, choices, answerSql);
            }
        } finally {
            sandboxPool.release(dbName);
        }
    }

    /**
     * 표준 검증: answerSql 결과와 일치하는 선택지 1개를 정답으로 판별.
     */
    private ValidationReport validateStandard(
            String dbName,
            List<GeneratedChoiceDto> choices,
            String answerSql
    ) {
        // 정답 SQL 실행 → expected
        ExecuteResult expected = sandboxExecutor.execute(dbName, answerSql);
        if (!"OK".equals(expected.status())) {
            throw new CustomException(ErrorCode.SANDBOX_ANSWER_SQL_FAILED,
                    "기준 정답 SQL 실행 실패: " + expected.errorMessage());
        }

        List<ChoiceValidation> validations = new ArrayList<>();
        int correctCount = 0;

        for (GeneratedChoiceDto choice : choices) {
            ExecuteResult actual = sandboxExecutor.execute(dbName, choice.body());
            boolean matches = false;
            if ("OK".equals(actual.status())) {
                matches = resultSetsMatch(expected, actual);
            }
            if (matches) correctCount++;
            validations.add(new ChoiceValidation(
                    choice.key(), actual.status(), actual.rows(),
                    actual.elapsedMs(), matches, actual.errorMessage()));
        }

        return new ValidationReport(correctCount, validations);
    }

    /**
     * ODD_ONE_OUT 검증: "결과가 다른 것은?" 유형.
     * 4개 선택지를 모두 실행하여 결과를 그룹핑 — 3:1로 나뉘면 소수(1개) 쪽을 정답(is_correct=true)으로 판별.
     * 2:2 또는 4:0 등 명확한 소수가 없으면 검증 실패로 처리 (correctCount=0 반환).
     */
    private ValidationReport validateOddOneOut(
            String dbName,
            List<GeneratedChoiceDto> choices
    ) {
        // 각 선택지 실행
        List<ExecuteResult> results = new ArrayList<>();
        for (GeneratedChoiceDto choice : choices) {
            results.add(sandboxExecutor.execute(dbName, choice.body()));
        }

        // 결과를 문자열 시그니처로 그룹핑 (정렬 무시)
        // 실행 실패(ERROR)는 별도 시그니처로 취급
        List<String> signatures = new ArrayList<>();
        for (ExecuteResult r : results) {
            if (!"OK".equals(r.status())) {
                signatures.add("ERROR:" + r.errorMessage());
            } else {
                List<List<Object>> sorted = r.rows().stream()
                        .sorted(Comparator.comparing(Objects::toString))
                        .toList();
                signatures.add(r.columns() + "|" + sorted);
            }
        }

        // 시그니처별 등장 횟수 집계
        Map<String, Long> freq = new LinkedHashMap<>();
        for (String sig : signatures) {
            freq.merge(sig, 1L, Long::sum);
        }

        // 3:1로 나뉘는 경우만 유효 — 등장 1회인 시그니처가 정답
        String oddSignature = null;
        for (Map.Entry<String, Long> entry : freq.entrySet()) {
            if (entry.getValue() == 1L) {
                if (oddSignature != null) {
                    // 소수가 2개 이상 → 명확하지 않음 → 실패
                    oddSignature = null;
                    break;
                }
                oddSignature = entry.getKey();
            }
        }

        List<ChoiceValidation> validations = new ArrayList<>();
        int correctCount = 0;

        for (int i = 0; i < choices.size(); i++) {
            GeneratedChoiceDto choice = choices.get(i);
            ExecuteResult r = results.get(i);
            boolean isOdd = oddSignature != null && signatures.get(i).equals(oddSignature);
            if (isOdd) correctCount++;
            validations.add(new ChoiceValidation(
                    choice.key(), r.status(), r.rows(),
                    r.elapsedMs(), isOdd, r.errorMessage()));
        }

        return new ValidationReport(correctCount, validations);
    }

    /**
     * 두 결과셋을 정렬 무시하고 비교한다 (중복 행 포함).
     * HashSet 은 중복 행을 제거하므로, 각 행을 문자열 변환 후 정렬하여 비교한다.
     */
    private boolean resultSetsMatch(ExecuteResult expected, ExecuteResult actual) {
        if (!expected.columns().equals(actual.columns())) {
            return false;
        }
        if (expected.rows().size() != actual.rows().size()) {
            return false;
        }
        // 각 row를 문자열로 변환 후 정렬 → 순서 무시하면서 중복 행도 보존
        Comparator<List<Object>> rowComparator = Comparator.comparing(Objects::toString);
        List<List<Object>> expectedSorted = expected.rows().stream()
                .sorted(rowComparator).toList();
        List<List<Object>> actualSorted = actual.rows().stream()
                .sorted(rowComparator).toList();
        return expectedSorted.equals(actualSorted);
    }
}
