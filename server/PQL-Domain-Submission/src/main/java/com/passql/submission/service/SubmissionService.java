package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.SubmitResult;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.service.SandboxExecutor;
import com.passql.question.service.SandboxPool;
import com.passql.submission.dto.MonitorStats;
import com.passql.submission.entity.ExecutionLog;
import com.passql.submission.entity.Submission;
import com.passql.submission.repository.ExecutionLogRepository;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final QuestionRepository questionRepository;
    private final ExecutionLogRepository executionLogRepository;
    private final SandboxExecutor sandboxExecutor;
    private final SandboxPool sandboxPool;
    // AI 코멘트 캐시 무효화용 (submit 완료 시 evict)
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public SubmitResult submit(UUID memberUuid, UUID questionUuid, UUID choiceSetId, String selectedChoiceKey) {
        // 1. ChoiceSet 조회
        QuestionChoiceSet choiceSet = choiceSetRepository.findById(choiceSetId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND));

        // 2. 선택한 선택지 조회
        QuestionChoiceSetItem selected = choiceSetItemRepository
                .findByChoiceSetUuidAndChoiceKey(choiceSetId, selectedChoiceKey)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_ITEM_NOT_FOUND));

        // 3. 정답 선택지 조회
        List<QuestionChoiceSetItem> allItems = choiceSetItemRepository
                .findByChoiceSetUuidOrderBySortOrderAsc(choiceSetId);
        QuestionChoiceSetItem correct = allItems.stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsCorrect()))
                .findFirst()
                .orElse(null);

        boolean isCorrect = Boolean.TRUE.equals(selected.getIsCorrect());

        // 4. ChoiceSet 소비 시각 기록 (최초 제출 시)
        if (choiceSet.getConsumedAt() == null) {
            choiceSet.setConsumedAt(LocalDateTime.now());
            choiceSetRepository.save(choiceSet);
        }

        // 5. Submission 저장 (choiceSetUuid 포함)
        Submission submission = Submission.builder()
                .memberUuid(memberUuid)
                .questionUuid(questionUuid)
                .choiceSetUuid(choiceSetId)
                .selectedChoiceKey(selectedChoiceKey)
                .isCorrect(isCorrect)
                .submittedAt(LocalDateTime.now())
                .build();
        submissionRepository.save(submission);

        // 6. EXECUTABLE 문제: 양쪽 SQL 실행 결과 비교
        ExecuteResult selectedResult = null;
        ExecuteResult correctResult = null;
        String correctSql = null;
        String selectedSql = null;

        Question question = questionRepository.findById(questionUuid).orElse(null);
        if (question != null && question.getExecutionMode() == ExecutionMode.EXECUTABLE) {
            String dbName = question.getSandboxDbName();

            selectedSql = selected.getBody();
            if (correct != null) {
                correctSql = correct.getBody();
            }

            if (dbName != null && !dbName.isBlank()) {
                // 영구 sandbox DB — executeChoice()와 동일 경로
                selectedResult = sandboxExecutor.execute(dbName, selectedSql);
                if (correctSql != null) {
                    correctResult = sandboxExecutor.execute(dbName, correctSql);
                }
            } else {
                // sandboxDbName 미설정: SandboxPool에서 임시 DB를 빌려 DDL 적용 → 실행 → 반납
                // executeChoice()와 동일한 경로 — questionUuid 폴백 DB는 존재하지 않으므로 사용 금지
                String tempDb = sandboxPool.acquire();
                try {
                    String setupSql = question.getSchemaDdl() != null ? question.getSchemaDdl() : "";
                    if (question.getSchemaSampleData() != null && !question.getSchemaSampleData().isBlank()) {
                        setupSql = setupSql + ";\n" + question.getSchemaSampleData();
                    }
                    if (!setupSql.isBlank()) {
                        sandboxExecutor.applyDdl(tempDb, setupSql);
                    }
                    selectedResult = sandboxExecutor.execute(tempDb, selectedSql);
                    if (correctSql != null) {
                        correctResult = sandboxExecutor.execute(tempDb, correctSql);
                    }
                } finally {
                    sandboxPool.release(tempDb);
                }
            }
        }

        // 7. AI 코멘트 캐시: 세션 단위(ai-comment:{memberUuid}:{sessionUuid})로 전환됨.
        //    새 세션 시작 시 새 sessionUuid로 요청이 오므로 별도 evict 불필요.

        return new SubmitResult(
                isCorrect,
                correct != null ? correct.getChoiceKey() : null,
                selected.getRationale(),
                selectedResult,
                correctResult,
                correctSql,
                selectedSql
        );
    }

    public List<Submission> getSubmissionsByMember(UUID memberUuid) {
        return submissionRepository.findByMemberUuidOrderBySubmittedAtDesc(memberUuid);
    }

    public List<ExecutionLog> getRecentLogs() {
        return executionLogRepository.findTop20ByOrderByExecutedAtDesc();
    }

    public MonitorStats getStats24h() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<ExecutionLog> logs = executionLogRepository.findByExecutedAtAfter(since);
        long successCount = logs.stream().filter(l -> "OK".equals(l.getStatus())).count();
        long failCount = logs.stream().filter(l -> !"OK".equals(l.getStatus())).count();
        double avgMs = logs.stream()
                .filter(l -> l.getElapsedMs() != null)
                .mapToLong(ExecutionLog::getElapsedMs)
                .average().orElse(0);
        return new MonitorStats(successCount, failCount, avgMs, 0L);
    }
}
