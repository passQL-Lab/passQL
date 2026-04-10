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

            if (item.questionUuid() != null && questionRepository.existsById(item.questionUuid())) {
                questionService.updateQuestion(
                        item.questionUuid(), item.stem(), null,
                        item.schemaDdl(), item.schemaSampleData(), item.schemaIntent(),
                        item.answerSql(), item.hint(), item.difficulty(), mode,
                        topicUuid, null);
                updated++;
            } else {
                questionGenerateService.createQuestionOnly(
                        topicUuid, null, item.difficulty(), mode,
                        item.stem(), item.schemaDdl(), item.schemaSampleData(),
                        item.schemaIntent(), item.answerSql(), item.hint(),
                        ChoiceSetPolicy.AI_ONLY);
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

        // EXECUTABLE 추가 필수 필드
        if (item.schemaDdl() == null || item.schemaDdl().isBlank()
                || item.answerSql() == null || item.answerSql().isBlank()) {
            return new ImportItemResult(index, stemPreview, item.topicCode(), item.difficulty(),
                    item.executionMode(), "FAIL", null, null,
                    "EXECUTABLE 문제: schemaDdl, answerSql 필수", importAction);
        }

        // Sandbox 실행 테스트
        return executeSandboxTest(index, item, stemPreview, importAction);
    }

    private ImportItemResult executeSandboxTest(int index, QuestionExportDto item, String stemPreview, String importAction) {
        String dbName = null;
        try {
            dbName = sandboxPool.acquire();
            String setupSql = item.schemaDdl();
            if (item.schemaSampleData() != null && !item.schemaSampleData().isBlank()) {
                setupSql = setupSql + ";\n" + item.schemaSampleData();
            }
            sandboxExecutor.applyDdl(dbName, setupSql);
            ExecuteResult execResult = sandboxExecutor.execute(dbName, item.answerSql());

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
                q.getStem(),
                q.getHint(),
                q.getSchemaDdl(),
                q.getSchemaSampleData(),
                q.getSchemaIntent(),
                q.getAnswerSql()
        )).toList();
    }
}
