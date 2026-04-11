package com.passql.question.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.math.BigDecimal;
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
    // RESULT_MATCH 검증용 JSON 파서 — 스프링 빈 주입으로 설정 일관성 보장
    private final ObjectMapper objectMapper;

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
            // AI가 SQL 쿼리 대신 실행 결과 텍스트를 body에 넣는 경우 방어:
            // SELECT/WITH로 시작하지 않으면 DB 커넥션 소비 없이 즉시 ERROR 처리
            String bodyTrimmed = choice.body() != null ? choice.body().trim().toUpperCase() : "";
            if (!bodyTrimmed.startsWith("SELECT") && !bodyTrimmed.startsWith("WITH")) {
                log.warn("[validateStandard] body가 SQL 쿼리가 아님 (스킵): key={}, bodyPreview={}",
                        choice.key(),
                        choice.body() != null && choice.body().length() > 50
                                ? choice.body().substring(0, 50) + "..."
                                : choice.body());
                validations.add(new ChoiceValidation(
                        choice.key(), "ERROR", List.of(), 0, false,
                        "body가 SQL 쿼리가 아닙니다: " + bodyTrimmed.substring(0, Math.min(30, bodyTrimmed.length()))));
                continue;
            }

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

    /**
     * RESULT_MATCH 검증: 각 선택지 body(JSON 배열)를 파싱하여 expected ExecuteResult와 비교.
     * Sandbox를 재획득하지 않음 — generateResultMatch()에서 이미 실행한 결과를 전달받는다.
     *
     * @param choices        AI 생성 선택지 목록
     * @param expectedResult answerSql 실행 결과 (generateResultMatch에서 전달)
     * @return 검증 결과
     */
    public ValidationReport validateResultMatch(
            List<GeneratedChoiceDto> choices,
            ExecuteResult expectedResult
    ) {
        List<ChoiceValidation> validations = new ArrayList<>();
        int correctCount = 0;

        for (GeneratedChoiceDto choice : choices) {
            // body가 null이거나 비어있으면 즉시 ERROR
            String body = choice.body();
            if (body == null || body.isBlank()) {
                validations.add(new ChoiceValidation(
                        choice.key(), "ERROR", List.of(), 0, false, "body가 비어있습니다."));
                continue;
            }

            // JSON 배열 파싱 시도
            List<Map<String, Object>> parsedRows;
            try {
                parsedRows = objectMapper.readValue(body, new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("[validateResultMatch] JSON 파싱 실패: key={}, bodyPreview={}",
                        choice.key(),
                        body.length() > 50 ? body.substring(0, 50) + "..." : body);
                validations.add(new ChoiceValidation(
                        choice.key(), "ERROR", List.of(), 0, false,
                        "body가 JSON 배열이 아닙니다: " + e.getMessage()));
                continue;
            }

            // expected rows와 비교 (열 이름 대소문자 무시, 행 순서 무시)
            boolean matches = resultMatchesExpected(expectedResult, parsedRows);
            if (matches) correctCount++;

            // 검증 결과 rows — 파싱된 Map의 values를 List<List<Object>>로 변환
            List<List<Object>> rowsForReport = parsedRows.stream()
                    .map(row -> (List<Object>) new ArrayList<>(row.values()))
                    .toList();
            validations.add(new ChoiceValidation(
                    choice.key(), "OK", rowsForReport, 0, matches, null));
        }

        return new ValidationReport(correctCount, validations);
    }

    /**
     * answerSql ExecuteResult와 파싱된 JSON rows를 비교한다.
     * 열 이름 대소문자 무시, 행 순서 무시, 값은 toString()으로 비교.
     */
    private boolean resultMatchesExpected(
            ExecuteResult expected,
            List<Map<String, Object>> parsedRows
    ) {
        // 행 수가 다르면 즉시 불일치
        if (expected.rows().size() != parsedRows.size()) {
            return false;
        }

        // expected rows를 "대문자열이름=값문자열" 쌍의 정렬된 문자열 시그니처로 정규화
        // normalizeValue()로 DB Integer(1) vs AI JSON Double(1.0) 불일치 방지
        List<String> expectedSignatures = expected.rows().stream()
                .map(row -> {
                    List<String> pairs = new ArrayList<>();
                    for (int i = 0; i < expected.columns().size(); i++) {
                        String col = expected.columns().get(i).toUpperCase();
                        String val = normalizeValue(row.get(i));
                        pairs.add(col + "=" + val);
                    }
                    pairs.sort(String::compareTo);
                    return pairs.toString();
                })
                .sorted()
                .toList();

        // parsed rows를 동일한 방식으로 정규화
        List<String> parsedSignatures = parsedRows.stream()
                .map(row -> {
                    List<String> pairs = new ArrayList<>();
                    for (Map.Entry<String, Object> entry : row.entrySet()) {
                        pairs.add(entry.getKey().toUpperCase() + "=" + normalizeValue(entry.getValue()));
                    }
                    pairs.sort(String::compareTo);
                    return pairs.toString();
                })
                .sorted()
                .toList();

        return expectedSignatures.equals(parsedSignatures);
    }

    /**
     * DB 값과 AI JSON 값의 숫자 타입 불일치를 방지하기 위해 값을 정규화한다.
     * - DB: Integer(1) → "1"
     * - AI JSON: Double(1.0) → "1" (Gemini가 정수를 1.0으로 직렬화하는 경향)
     * - null은 "null" 문자열로 처리
     */
    private String normalizeValue(Object value) {
        if (value == null) return "null";
        // Number 계열 (Integer, Long, Double, Float 등) → BigDecimal로 통합 후 trailing zero 제거
        if (value instanceof Number) {
            try {
                return new BigDecimal(value.toString()).stripTrailingZeros().toPlainString();
            } catch (NumberFormatException e) {
                // NaN, Infinity 등 특수값은 toString 그대로
                return value.toString();
            }
        }
        return value.toString();
    }
}
