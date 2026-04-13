package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.CorrectionScope;
import com.passql.question.constant.ReportCategory;
import com.passql.question.constant.ReportStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID questionReportUuid;

    @Column(nullable = false)
    private UUID questionUuid;

    private UUID choiceSetUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private UUID submissionUuid;

    @ElementCollection
    @CollectionTable(name = "question_report_category",
            joinColumns = @JoinColumn(name = "question_report_uuid"))
    @Column(name = "category")
    @Enumerated(EnumType.STRING)
    private List<ReportCategory> categories;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    private LocalDateTime resolvedAt;

    private UUID resolvedBy;

    @Enumerated(EnumType.STRING)
    private CorrectionScope correctionScope;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_uuid", insertable = false, updatable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "choice_set_uuid", insertable = false, updatable = false)
    private QuestionChoiceSet choiceSet;

    @Builder
    public QuestionReport(UUID questionUuid, UUID choiceSetUuid, UUID memberUuid,
                          UUID submissionUuid, List<ReportCategory> categories, String detail) {
        this.questionUuid = questionUuid;
        this.choiceSetUuid = choiceSetUuid;
        this.memberUuid = memberUuid;
        this.submissionUuid = submissionUuid;
        this.categories = categories;
        this.detail = detail;
        this.status = ReportStatus.PENDING;
    }

    public void resolve(UUID adminMemberUuid, CorrectionScope correctionScope) {
        this.status = ReportStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.resolvedBy = adminMemberUuid;
        this.correctionScope = correctionScope;
    }
}
