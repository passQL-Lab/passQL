package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.CorrectionScope;
import com.passql.question.constant.ReportCategory;
import com.passql.question.constant.ReportStatus;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionReport;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuestionReportRepository;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionReportService {

    /** Controller가 DTO로 변환하는 데 사용하는 집계 행 — Web 모듈 DTO 의존 없이 Application 레이어에서 반환 */
    public record ReportSummaryRow(
            UUID questionUuid,
            String stem,
            long totalCount,
            long pendingCount,
            LocalDateTime latestReportedAt
    ) {}

    private final QuestionReportRepository questionReportRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;

    /** 사용자 신고 제출 */
    @Transactional
    public void submitReport(UUID questionUuid, UUID memberUuid, UUID submissionUuid,
                             UUID choiceSetUuid, List<ReportCategory> categories, String detail) {
        // 입력 검증 — Controller 대신 Service에서 처리 (CLAUDE.md 규칙: Controller 비즈니스 로직 금지)
        if (submissionUuid == null) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (categories == null || categories.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (categories.contains(ReportCategory.ETC) && (detail == null || detail.isBlank())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (questionReportRepository.existsByMemberUuidAndSubmissionUuid(memberUuid, submissionUuid)) {
            throw new CustomException(ErrorCode.REPORT_ALREADY_EXISTS);
        }
        QuestionReport report = QuestionReport.builder()
                .questionUuid(questionUuid)
                .choiceSetUuid(choiceSetUuid)
                .memberUuid(memberUuid)
                .submissionUuid(submissionUuid)
                .categories(categories)
                .detail(detail)
                .build();
        questionReportRepository.save(report);
    }

    /** 신고 여부 조회 — questionUuid + memberUuid + submissionUuid 3중 조건으로 정합성 보장 */
    public boolean isReported(UUID questionUuid, UUID memberUuid, UUID submissionUuid) {
        return questionReportRepository
                .existsByQuestionUuidAndMemberUuidAndSubmissionUuid(questionUuid, memberUuid, submissionUuid);
    }

    /** 관리자: 문제별 집계 목록 — questionUuid 배치 조회로 N+1 방지, status 유효성 검증 포함 */
    public List<ReportSummaryRow> getReportSummaries(String status) {
        // status가 주어진 경우 enum 유효성 검증 — 잘못된 값은 400 반환
        if (status != null && !status.isBlank()) {
            try {
                ReportStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
        }

        List<Object[]> rows = (status != null && !status.isBlank())
                ? questionReportRepository.findReportSummaryGroupByQuestionAndStatus(status)
                : questionReportRepository.findReportSummaryGroupByQuestion();

        // 집계 결과의 questionUuid 목록을 한 번에 조회 (N+1 방지)
        List<UUID> questionUuids = rows.stream()
                .map(row -> (UUID) row[0])
                .collect(Collectors.toList());
        Map<UUID, String> stemMap = questionRepository.findAllById(questionUuids).stream()
                .collect(Collectors.toMap(Question::getQuestionUuid, Question::getStem));

        return rows.stream().map(row -> {
            UUID questionUuid = (UUID) row[0];
            String stem = stemMap.getOrDefault(questionUuid, "(삭제된 문제)");
            // nativeQuery 결과의 Timestamp 타입은 드라이버에 따라 다를 수 있으므로 instanceof로 안전 처리
            LocalDateTime latestReportedAt = null;
            if (row[3] instanceof Timestamp ts) {
                latestReportedAt = ts.toLocalDateTime();
            } else if (row[3] instanceof LocalDateTime ldt) {
                latestReportedAt = ldt;
            }
            return new ReportSummaryRow(
                    questionUuid,
                    stem,
                    ((Number) row[1]).longValue(),
                    ((Number) row[2]).longValue(),
                    latestReportedAt
            );
        }).collect(Collectors.toList());
    }

    /** 관리자: 특정 문제 신고 건 목록 */
    public List<QuestionReport> getReportsByQuestion(UUID questionUuid) {
        return questionReportRepository.findByQuestionUuidOrderByCreatedAtDesc(questionUuid);
    }

    /** 관리자: 문제 단건 조회 — Controller에서 NotFound 처리에 사용 */
    public Optional<Question> getQuestion(UUID questionUuid) {
        return questionRepository.findById(questionUuid);
    }

    /** 관리자: 신고 처리 (resolve) */
    @Transactional
    public void resolveReport(UUID reportUuid, UUID adminMemberUuid,
                              CorrectionScope correctionScope, Boolean deactivateQuestion) {
        // correctionScope null 입력 방어 — null이면 DB에 null이 저장되어 데이터 정합성 오염
        if (correctionScope == null) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        QuestionReport report = questionReportRepository.findById(reportUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.REPORT_NOT_FOUND));

        if (report.getStatus() == ReportStatus.RESOLVED) {
            throw new CustomException(ErrorCode.REPORT_ALREADY_RESOLVED);
        }

        if (correctionScope == CorrectionScope.CHOICE_SET_ONLY && report.getChoiceSetUuid() == null) {
            throw new CustomException(ErrorCode.REPORT_CHOICE_SET_REQUIRED);
        }

        // 1. 신고 상태 변경
        report.resolve(adminMemberUuid, correctionScope);

        // 2. 문제 비활성화
        if (Boolean.TRUE.equals(deactivateQuestion)) {
            questionRepository.findById(report.getQuestionUuid())
                    .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND))
                    .deactivate();
        }

        // 3. Submission 소급 보정
        if (correctionScope == CorrectionScope.QUESTION_WIDE) {
            submissionRepository.correctAllByQuestionUuid(report.getQuestionUuid());
        } else if (correctionScope == CorrectionScope.CHOICE_SET_ONLY) {
            submissionRepository.correctAllByChoiceSetUuid(report.getChoiceSetUuid());
        }
    }
}
