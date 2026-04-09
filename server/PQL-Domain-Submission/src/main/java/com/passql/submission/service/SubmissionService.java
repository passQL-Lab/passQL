package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.SubmitResult;
import com.passql.question.entity.QuestionChoice;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.submission.dto.MonitorStats;
import com.passql.submission.entity.ExecutionLog;
import com.passql.submission.entity.Submission;
import com.passql.submission.repository.ExecutionLogRepository;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;
    private final ExecutionLogRepository executionLogRepository;

    public SubmitResult submit(UUID memberUuid, UUID questionUuid, String selectedChoiceKey) {
        QuestionChoice selected = questionChoiceRepository
                .findByQuestionUuidAndChoiceKey(questionUuid, selectedChoiceKey)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        List<QuestionChoice> all = questionChoiceRepository.findByQuestionUuidOrderBySortOrderAsc(questionUuid);
        QuestionChoice correct = all.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsCorrect()))
                .findFirst()
                .orElse(null);

        boolean isCorrect = Boolean.TRUE.equals(selected.getIsCorrect());

        Submission submission = Submission.builder()
                .memberUuid(memberUuid)
                .questionUuid(questionUuid)
                .selectedChoiceKey(selectedChoiceKey)
                .isCorrect(isCorrect)
                .submittedAt(LocalDateTime.now())
                .build();
        submissionRepository.save(submission);

        return new SubmitResult(
                isCorrect,
                correct != null ? correct.getChoiceKey() : null,
                selected.getRationale()
        );
    }

    @Transactional(readOnly = true)
    public List<Submission> getSubmissionsByMember(UUID memberUuid) {
        return submissionRepository.findByMemberUuidOrderBySubmittedAtDesc(memberUuid);
    }

    @Transactional(readOnly = true)
    public List<ExecutionLog> getRecentLogs() {
        return executionLogRepository.findTop20ByOrderByExecutedAtDesc();
    }

    @Transactional(readOnly = true)
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
