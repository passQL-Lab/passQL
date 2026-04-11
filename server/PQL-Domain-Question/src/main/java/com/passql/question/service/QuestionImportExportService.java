package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.*;
import com.passql.question.entity.Question;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionImportExportService {

    private static final int IMPORT_LIMIT = 100;
    private static final int EXPORT_LIMIT = 500;

    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final SandboxPool sandboxPool;
    private final SandboxExecutor sandboxExecutor;
    private final QuestionGenerateService questionGenerateService;
    private final QuestionService questionService;

    // ── Export ────────────────────────────────────────────────────

    /**
     * 필터 조건 기반 전체 내보내기.
     */
    public List<QuestionExportDto> exportByFilter(String topicCode, Integer difficulty, String executionMode) {
        UUID topicUuid = null;
        if (topicCode != null && !topicCode.isBlank()) {
            topicUuid = topicRepository.findByCode(topicCode)
                    .map(Topic::getTopicUuid)
                    .orElseThrow(() -> new CustomException(ErrorCode.TOPIC_NOT_FOUND));
        }
        ExecutionMode mode = parseExecutionModeSafe(executionMode);

        List<Question> questions = questionRepository.findByFiltersAll(
                topicUuid, difficulty, mode, PageRequest.ofSize(EXPORT_LIMIT));
        if (questions.isEmpty()) {
            throw new CustomException(ErrorCode.EXPORT_NO_DATA);
        }
        return toExportDtos(questions);
    }

    /**
     * UUID 목록 기반 내보내기.
     */
    public List<QuestionExportDto> exportByUuids(List<UUID> questionUuids) {
        List<Question> questions = questionRepository.findAllById(questionUuids);
        if (questions.isEmpty()) {
            throw new CustomException(ErrorCode.EXPORT_NO_DATA);
        }
        return toExportDtos(questions);
    }

    // ── Validate ─────────────────────────────────────────────────

    /**
     * 배치 Sandbox 검증.
     */
    public ImportValidationResult validateBatch(List<QuestionExportDto> items) {
        if (items.size() > IMPORT_LIMIT) {
            throw new CustomException(ErrorCode.IMPORT_LIMIT_EXCEEDED);
        }

        List<ImportItemResult> results = new ArrayList<>();
        int success = 0;
        int failed = 0;
        int newCount = 0;
        int updateCount = 0;

        for (int i = 0; i < items.size(); i++) {
            QuestionExportDto item = items.get(i);
            String stemPreview = truncateStem(item.stem());
            String importAction = resolveImportAction(item);

            if ("UPDATE".equals(importAction)) {
                updateCount++;
            } else {
                newCount++;
            }

            ImportItemResult result = validateSingleItem(i, item, stemPreview, importAction);
            results.add(result);

            if ("FAIL".equals(result.sandboxStatus())) {
                failed++;
            } else {
                success++;
            }
        }

        return new ImportValidationResult(items.size(), success, failed, newCount, updateCount, results);
    }

    // ── Import ───────────────────────────────────────────────────

    /**
     * 검증 후 실제 등록/업데이트.
     * SUCCESS_ONLY 모드: 프론트에서 전달한 검증 결과의 sandboxStatus 목록을 기반으로 FAIL 항목을 스킵한다.
     * (Sandbox를 재실행하지 않음)
     */
    @Transactional
    public ImportResult importBatch(ImportRequest request) {
        List<QuestionExportDto> items = request.items();
        String importMode = request.importMode();
        List<String> sandboxStatuses = request.sandboxStatuses();

        if (items.size() > IMPORT_LIMIT) {
            throw new CustomException(ErrorCode.IMPORT_LIMIT_EXCEEDED);
        }

        boolean isSuccessOnly = "SUCCESS_ONLY".equals(importMode);

        // SUCCESS_ONLY인데 sandboxStatuses가 없으면 안전하게 전체 스킵
        if (isSuccessOnly && (sandboxStatuses == null || sandboxStatuses.size() != items.size())) {
            log.warn("[import-batch] SUCCESS_ONLY 모드인데 sandboxStatuses 누락/불일치. 전체 스킵.");
            return new ImportResult(0, 0, items.size());
        }

        // topicCode → UUID 매핑을 한번에 조회 (N+1 방지)
        Map<String, UUID> topicCodeToUuid = buildTopicCodeMap(items);

        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (int i = 0; i < items.size(); i++) {
            QuestionExportDto item = items.get(i);

            // SUCCESS_ONLY 모드: FAIL 항목 스킵
            if (isSuccessOnly && "FAIL".equals(sandboxStatuses.get(i))) {
                skipped++;
                continue;
            }

            UUID topicUuid = topicCodeToUuid.get(item.topicCode());
            if (topicUuid == null) {
                skipped++;
                continue;
            }

            ExecutionMode mode = parseExecutionModeSafe(item.executionMode());
            if (mode == null) {
                skipped++;
                continue;
            }

            // 1:1 치환 가능한 Oracle 문법을 MariaDB 호환으로 변환 후 저장 (validate 단계와 동일하게 적용)
            String savedDdl       = translateOracleToMariaDb(item.schemaDdl());
            String savedSample    = translateOracleToMariaDb(item.schemaSampleData());
            String savedAnswerSql = translateOracleToMariaDb(item.answerSql());

            // 치환 후에도 Oracle 전용 문법이 남아있으면 CONCEPT_ONLY로 자동 전환
            if (mode == ExecutionMode.EXECUTABLE
                    && detectOracleOnlySyntax(savedAnswerSql, savedDdl, savedSample, item.stem()) != null) {
                mode = ExecutionMode.CONCEPT_ONLY;
            }

            ChoiceSetPolicy policy = parseChoiceSetPolicySafe(item.choiceSetPolicy());

            if (item.questionUuid() != null && questionRepository.existsById(item.questionUuid())) {
                questionService.updateQuestion(
                        item.questionUuid(), item.stem(), null,
                        savedDdl, savedSample, item.schemaIntent(),
                        savedAnswerSql, item.hint(), item.difficulty(), mode,
                        topicUuid, null);
                // choiceSetPolicy는 updateQuestion에 파라미터가 없으므로 별도 업데이트
                questionService.updateChoiceSetPolicy(item.questionUuid(), policy);
                updated++;
            } else {
                questionGenerateService.createQuestionOnly(
                        topicUuid, null, item.difficulty(), mode,
                        item.stem(), savedDdl, savedSample,
                        item.schemaIntent(), savedAnswerSql, item.hint(),
                        policy);
                created++;
            }
        }

        log.info("[import-batch] created={}, updated={}, skipped={}", created, updated, skipped);
        return new ImportResult(created, updated, skipped);
    }

    /**
     * items의 topicCode들을 한번에 조회하여 topicCode → topicUuid 매핑 반환.
     */
    private Map<String, UUID> buildTopicCodeMap(List<QuestionExportDto> items) {
        Set<String> topicCodes = items.stream()
                .map(QuestionExportDto::topicCode)
                .filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toSet());

        Map<String, UUID> map = new HashMap<>();
        for (String code : topicCodes) {
            topicRepository.findByCode(code).ifPresent(t -> map.put(code, t.getTopicUuid()));
        }
        return map;
    }

    // ── Private helpers ──────────────────────────────────────────

    private ImportItemResult validateSingleItem(int index, QuestionExportDto item, String stemPreview, String importAction) {
        // 필수 필드 검증
        if (item.topicCode() == null || item.topicCode().isBlank()
                || item.difficulty() == null
                || item.executionMode() == null || item.executionMode().isBlank()
                || item.stem() == null || item.stem().isBlank()) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "필수 필드 누락 (topicCode, difficulty, executionMode, stem)", importAction);
        }

        // topicCode 유효성
        if (topicRepository.findByCode(item.topicCode()).isEmpty()) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "존재하지 않는 토픽: " + item.topicCode(), importAction);
        }

        // executionMode 유효성
        ExecutionMode mode = parseExecutionModeSafe(item.executionMode());
        if (mode == null) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "유효하지 않은 실행 모드: " + item.executionMode(), importAction);
        }

        // CONCEPT_ONLY → Sandbox 스킵
        if (mode == ExecutionMode.CONCEPT_ONLY) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "SKIP", null, null, null, importAction);
        }

        // 1단계: 1:1 치환 가능한 Oracle 문법을 MariaDB 호환으로 변환 (NVL→IFNULL, SYSDATE→NOW())
        String translatedDdl       = translateOracleToMariaDb(item.schemaDdl());
        String translatedSample    = translateOracleToMariaDb(item.schemaSampleData());
        String translatedAnswerSql = translateOracleToMariaDb(item.answerSql());

        // 2단계: 치환 후에도 남은 Oracle 전용 문법 감지 → CONCEPT_ONLY 자동 전환
        // (CONNECT BY, ROWNUM, NVL2, DECODE 등 단순 치환 불가 문법)
        String oracleKeyword = detectOracleOnlySyntax(translatedAnswerSql, translatedDdl, translatedSample, item.stem());
        if (oracleKeyword != null) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    "CONCEPT_ONLY", "SKIP", null, null,
                    "[Oracle 전용 문법 감지 → CONCEPT_ONLY 자동 전환] 키워드: " + oracleKeyword, importAction);
        }

        // EXECUTABLE 추가 필수 필드
        if (translatedDdl == null || translatedDdl.isBlank()
                || translatedAnswerSql == null || translatedAnswerSql.isBlank()) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "EXECUTABLE 문제: schemaDdl, answerSql 필수", importAction);
        }

        // Sandbox 실행 테스트 (치환된 SQL로 실행)
        return executeSandboxTest(index, item, stemPreview, importAction,
                translatedDdl, translatedSample, translatedAnswerSql);
    }

    private ImportItemResult executeSandboxTest(int index, QuestionExportDto item, String stemPreview,
                                                String importAction,
                                                String schemaDdl, String schemaSampleData, String answerSql) {
        String dbName = null;
        try {
            dbName = sandboxPool.acquire();
            String setupSql = schemaDdl;
            if (schemaSampleData != null && !schemaSampleData.isBlank()) {
                setupSql = setupSql + ";\n" + schemaSampleData;
            }
            sandboxExecutor.applyDdl(dbName, setupSql);
            ExecuteResult execResult = sandboxExecutor.execute(dbName, answerSql);

            if ("OK".equals(execResult.status())) {
                return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                        item.executionMode(), "OK", execResult.rowCount(), execResult.elapsedMs(),
                        null, importAction);
            } else {
                return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                        item.executionMode(), "FAIL", null, execResult.elapsedMs(),
                        execResult.errorMessage(), importAction);
            }
        } catch (Exception e) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "Sandbox 오류: " + e.getMessage(), importAction);
        } finally {
            if (dbName != null) {
                sandboxPool.release(dbName);
            }
        }
    }

    private String resolveImportAction(QuestionExportDto item) {
        if (item.questionUuid() != null && questionRepository.existsById(item.questionUuid())) {
            return "UPDATE";
        }
        return "NEW";
    }

    private String truncateStem(String stem) {
        if (stem == null) return "";
        return stem.length() > 50 ? stem.substring(0, 50) + "..." : stem;
    }

    // NVL( 패턴: 대소문자 무관, 함수명과 괄호 사이 공백 허용
    private static final Pattern PATTERN_NVL     = Pattern.compile("(?i)\\bNVL\\s*\\(");
    // SYSDATE: 뒤에 괄호 없이 단독으로 쓰이는 키워드
    private static final Pattern PATTERN_SYSDATE = Pattern.compile("(?i)\\bSYSDATE\\b");

    /**
     * 1:1 치환 가능한 Oracle 문법을 MariaDB 호환 문법으로 변환한다.
     * - NVL(a, b)  → IFNULL(a, b)   (인자 순서·개수 동일, 안전)
     * - SYSDATE    → NOW()           (동일 의미, 안전)
     * NVL2, DECODE, TO_DATE, TO_CHAR 등은 인자 구조가 달라 단순 치환 시 오작동 위험 → 미포함.
     *
     * @param sql 변환할 SQL 문자열 (null이면 null 그대로 반환)
     * @return 변환된 SQL 문자열
     */
    public String translateOracleToMariaDb(String sql) {
        if (sql == null) return null;
        String result = PATTERN_NVL.matcher(sql).replaceAll("IFNULL(");
        result = PATTERN_SYSDATE.matcher(result).replaceAll("NOW()");
        return result;
    }

    /**
     * Oracle 전용 문법 키워드를 검사한다 (DTO 오버로드 — import 흐름에서 사용).
     */
    private String detectOracleOnlySyntax(QuestionExportDto item) {
        return detectOracleOnlySyntax(item.answerSql(), item.schemaDdl(), item.schemaSampleData(), item.stem());
    }

    /**
     * Oracle 전용 문법 키워드를 검사한다.
     * MariaDB에서 실행 불가하거나 결과가 달라지는 Oracle 전용 문법이 포함된 경우 해당 키워드를 반환한다.
     * 검사 대상: answerSql, schemaDdl, schemaSampleData, stem (문제 본문에 SQL 예시가 포함되는 경우)
     * 단일 문제 직접 등록 및 벌크 임포트 양쪽에서 호출된다.
     *
     * @return 감지된 Oracle 전용 키워드 (첫 번째 매칭), 없으면 null
     */
    public String detectOracleOnlySyntax(String answerSql, String schemaDdl, String schemaSampleData, String stem) {
        // 검사할 모든 SQL 관련 텍스트를 대문자로 합산
        StringBuilder combined = new StringBuilder();
        if (answerSql != null)         combined.append(answerSql).append("\n");
        if (schemaDdl != null)         combined.append(schemaDdl).append("\n");
        if (schemaSampleData != null)  combined.append(schemaSampleData).append("\n");
        if (stem != null)              combined.append(stem).append("\n");

        String upper = combined.toString().toUpperCase();

        // Oracle 전용 키워드 목록 (순서 중요: 더 긴 키워드를 먼저 검사)
        // 각 항목은 { 검사용 패턴, 사용자에게 보여줄 레이블 } 쌍
        // NVL(→IFNULL, SYSDATE→NOW()는 translateOracleToMariaDb()에서 사전 치환되므로 여기서 감지 불필요.
        // NVL2(는 3인자 구조가 달라 치환 불가 → 감지 대상 유지.
        // REGEXP_REPLACE는 MariaDB 10.0.5+에서 지원 → 감지 목록 제외.
        String[][] oracleKeywords = {
                // 계층적 쿼리 (CONNECT BY 절은 MariaDB 미지원)
                {"CONNECT_BY_ROOT",         "CONNECT_BY_ROOT"},
                {"SYS_CONNECT_BY_PATH",     "SYS_CONNECT_BY_PATH"},
                {"CONNECT BY",              "CONNECT BY"},
                {"START WITH",              "START WITH"},
                // GROUPING SETS: MariaDB 10.2.2 이상에서 부분 지원하나 문법 차이 존재
                {"GROUPING SETS",           "GROUPING SETS"},
                // Oracle 전용 정규식 함수 (MariaDB 미지원)
                {"REGEXP_COUNT(",           "REGEXP_COUNT"},
                {"REGEXP_SUBSTR(",          "REGEXP_SUBSTR"},
                {"REGEXP_INSTR(",           "REGEXP_INSTR"},
                // DUAL 의사 테이블 (MariaDB는 FROM DUAL 없이도 동작하지만 일부 문법에서 차이)
                {"FROM DUAL",               "FROM DUAL"},
                // Oracle OUTER JOIN 구문 (+) — MariaDB는 LEFT/RIGHT JOIN 사용
                {"(+)",                     "(+)"},
                // ROWNUM — MariaDB는 LIMIT/FETCH 사용
                {"ROWNUM",                  "ROWNUM"},
                // Oracle 전용 PIVOT/UNPIVOT
                {"PIVOT",                   "PIVOT"},
                {"UNPIVOT",                 "UNPIVOT"},
                // Oracle 전용 MERGE INTO
                {"MERGE INTO",              "MERGE INTO"},
                // Oracle SEQUENCE 객체
                {".NEXTVAL",                ".NEXTVAL"},
                {".CURRVAL",                ".CURRVAL"},
                // DECODE — MariaDB 미지원 (CASE WHEN으로 대체 필요, 인자 가변이라 자동 치환 불가)
                {"DECODE(",                 "DECODE"},
                // NVL2 — NVL과 달리 3인자이며 논리가 반대라 자동 치환 불가
                {"NVL2(",                   "NVL2"},
                // 날짜 함수 — 포맷 코드 체계가 달라 자동 치환 불가
                {"TO_DATE(",                "TO_DATE"},
                {"TO_CHAR(",                "TO_CHAR"},
                // ADD_MONTHS, MONTHS_BETWEEN — MariaDB 미지원
                {"ADD_MONTHS(",             "ADD_MONTHS"},
                {"MONTHS_BETWEEN(",         "MONTHS_BETWEEN"},
                // Oracle 계층 쿼리의 LEVEL 의사 컬럼
                {"SELECT LEVEL",            "SELECT LEVEL"},
        };

        for (String[] entry : oracleKeywords) {
            if (upper.contains(entry[0])) {
                return entry[1];
            }
        }
        return null;
    }

    /**
     * choiceSetPolicy 문자열을 안전하게 파싱. null이거나 유효하지 않으면 AI_ONLY 반환.
     */
    private ChoiceSetPolicy parseChoiceSetPolicySafe(String value) {
        if (value == null || value.isBlank()) return ChoiceSetPolicy.AI_ONLY;
        try {
            return ChoiceSetPolicy.valueOf(value);
        } catch (IllegalArgumentException e) {
            return ChoiceSetPolicy.AI_ONLY;
        }
    }

    /**
     * executionMode 문자열을 안전하게 파싱. 유효하지 않으면 null 반환.
     */
    private ExecutionMode parseExecutionModeSafe(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ExecutionMode.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * N+1 방지: Topic 전체를 한번에 조회하여 Map으로 변환 후 사용.
     */
    private List<QuestionExportDto> toExportDtos(List<Question> questions) {
        Set<UUID> topicUuids = questions.stream()
                .map(Question::getTopicUuid)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> topicCodeMap = topicRepository.findAllById(topicUuids).stream()
                .collect(Collectors.toMap(Topic::getTopicUuid, Topic::getCode));

        return questions.stream().map(q -> new QuestionExportDto(
                q.getQuestionUuid(),
                topicCodeMap.getOrDefault(q.getTopicUuid(), null),
                q.getDifficulty(),
                q.getExecutionMode() != null ? q.getExecutionMode().name() : null,
                q.getChoiceSetPolicy() != null ? q.getChoiceSetPolicy().name() : null,
                q.getStem(),
                q.getHint(),
                q.getSchemaDdl(),
                q.getSchemaSampleData(),
                q.getSchemaIntent(),
                q.getAnswerSql()
        )).toList();
    }
}
