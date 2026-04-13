# Question Report (문제 신고) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 AI 생성 문제/선택지의 오류를 신고하고, 관리자가 신고를 처리하며 정답률 소급 보정까지 수행할 수 있는 기능을 구현한다.

**Architecture:** `QuestionReport` 엔티티는 `PQL-Domain-Question`에 위치하고, 복잡한 처리 로직(문제 비활성화 + Submission 소급 보정)은 `PQL-Application`의 `QuestionReportService`가 조율한다. Controller는 `PQL-Web`에 위치하며, 프론트엔드는 PracticeResult 화면에 신고 모달을 추가하고 관리자 화면 2개를 신설한다.

**Tech Stack:** Spring Boot 3, JPA, PostgreSQL, Flyway, React 19, TypeScript, Tailwind CSS 4, daisyUI 5, TanStack Query

---

## 파일 구조

### 신규 생성

**Backend:**
- `server/PQL-Web/src/main/resources/db/migration/V0_0_120__add_question_report.sql`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionReport.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportCategory.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportStatus.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/CorrectionScope.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionReportRepository.java`
- `server/PQL-Application/src/main/java/com/passql/application/service/QuestionReportService.java`
- `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionReportController.java`
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminReportController.java`
- `server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportRequest.java`
- `server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportStatusResponse.java`
- `server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportSummary.java`
- `server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportDetailResponse.java`
- `server/PQL-Web/src/main/java/com/passql/web/dto/report/ResolveRequest.java`
- `server/PQL-Web/src/main/resources/templates/admin/reports.html`
- `server/PQL-Web/src/main/resources/templates/admin/report-detail.html`

**Frontend:**
- `client/src/api/reports.ts`
- `client/src/components/ReportModal.tsx`

### 수정

- `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` — Report 관련 ErrorCode 3개 추가
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java` — 소급 보정용 bulk update 메서드 추가
- `client/src/pages/PracticeResult.tsx` — 신고 버튼 + ReportModal 통합
- `client/src/api/questions.ts` — 신고 API 함수 추가 (또는 reports.ts 별도 분리)

---

## Task 1: Flyway 마이그레이션 + Enum 클래스

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_120__add_question_report.sql`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportCategory.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportStatus.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/CorrectionScope.java`

- [ ] **Step 1: Flyway SQL 파일 작성**

`server/PQL-Web/src/main/resources/db/migration/V0_0_120__add_question_report.sql`:

```sql
CREATE TABLE IF NOT EXISTS question_report (
    question_report_uuid UUID        PRIMARY KEY,
    question_uuid        UUID        NOT NULL,
    choice_set_uuid      UUID,
    member_uuid          UUID        NOT NULL,
    submission_uuid      UUID        NOT NULL,
    detail               TEXT,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolved_at          TIMESTAMP,
    resolved_by          UUID,
    correction_scope     VARCHAR(30),
    created_at           TIMESTAMP   NOT NULL,
    updated_at           TIMESTAMP   NOT NULL,
    created_by           VARCHAR(50),
    updated_by           VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS question_report_category (
    report_uuid UUID        NOT NULL REFERENCES question_report(question_report_uuid),
    category    VARCHAR(30) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_member_submission
    ON question_report(member_uuid, submission_uuid);
```

- [ ] **Step 2: ReportCategory Enum 작성**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportCategory.java`:

```java
package com.passql.question.entity.enums;

public enum ReportCategory {
    WRONG_ANSWER,    // 정답이 틀렸다
    WEIRD_QUESTION,  // 문제 자체가 이상하다
    WEIRD_CHOICES,   // 선택지가 이상하다
    WEIRD_EXECUTION, // SQL 실행 결과가 이상하다
    ETC              // 기타
}
```

- [ ] **Step 3: ReportStatus Enum 작성**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/ReportStatus.java`:

```java
package com.passql.question.entity.enums;

public enum ReportStatus {
    PENDING,  // 미처리
    RESOLVED  // 처리완료
}
```

- [ ] **Step 4: CorrectionScope Enum 작성**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/enums/CorrectionScope.java`:

```java
package com.passql.question.entity.enums;

public enum CorrectionScope {
    NONE,           // 보정 없음
    QUESTION_WIDE,  // 해당 questionUuid 전체 오답 보정
    CHOICE_SET_ONLY // 해당 choiceSetUuid 기준 오답만 보정
}
```

---

## Task 2: QuestionReport 엔티티 + ErrorCode

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionReport.java`
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: QuestionReport 엔티티 작성**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionReport.java`:

```java
package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.entity.enums.CorrectionScope;
import com.passql.question.entity.enums.ReportCategory;
import com.passql.question.entity.enums.ReportStatus;
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
    private UUID questionReportUuid;

    @Column(nullable = false)
    private UUID questionUuid;

    @Column(nullable = true)
    private UUID choiceSetUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private UUID submissionUuid;

    @ElementCollection
    @CollectionTable(name = "question_report_category",
            joinColumns = @JoinColumn(name = "report_uuid"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private List<ReportCategory> categories;

    @Column(nullable = true)
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @Column(nullable = true)
    private LocalDateTime resolvedAt;

    @Column(nullable = true)
    private UUID resolvedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private CorrectionScope correctionScope;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionUuid", insertable = false, updatable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "choiceSetUuid", insertable = false, updatable = false)
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
```

- [ ] **Step 2: ErrorCode에 Report 관련 코드 추가**

`server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`에서 Feedback 관련 코드 블록 아래에 추가:

```java
// Report
REPORT_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 신고한 제출입니다."),
REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고를 찾을 수 없습니다."),
REPORT_ALREADY_RESOLVED(HttpStatus.BAD_REQUEST, "이미 처리된 신고입니다."),
REPORT_CHOICE_SET_REQUIRED(HttpStatus.BAD_REQUEST, "선택지 세트 기준 보정은 choiceSetUuid가 필요합니다."),
```

---

## Task 3: QuestionReportRepository

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionReportRepository.java`

- [ ] **Step 1: Repository 작성**

`server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionReportRepository.java`:

```java
package com.passql.question.repository;

import com.passql.question.entity.QuestionReport;
import com.passql.question.entity.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionReportRepository extends JpaRepository<QuestionReport, UUID> {

    boolean existsByMemberUuidAndSubmissionUuid(UUID memberUuid, UUID submissionUuid);

    List<QuestionReport> findByQuestionUuidOrderByCreatedAtDesc(UUID questionUuid);

    /**
     * 문제별 집계: (questionUuid, totalCount, pendingCount, latestReportedAt)
     * status 필터 없이 모두 가져온 뒤 Service에서 필터링하는 방식 사용.
     * status가 PENDING인 경우만 보려면 파라미터로 전달.
     */
    @Query("""
        SELECT qr.questionUuid AS questionUuid,
               COUNT(qr) AS totalCount,
               SUM(CASE WHEN qr.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
               MAX(qr.createdAt) AS latestReportedAt
        FROM QuestionReport qr
        GROUP BY qr.questionUuid
        ORDER BY MAX(qr.createdAt) DESC
        """)
    List<Object[]> findReportSummaryGroupByQuestion();

    @Query("""
        SELECT qr.questionUuid AS questionUuid,
               COUNT(qr) AS totalCount,
               SUM(CASE WHEN qr.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount,
               MAX(qr.createdAt) AS latestReportedAt
        FROM QuestionReport qr
        WHERE qr.status = :status
        GROUP BY qr.questionUuid
        ORDER BY MAX(qr.createdAt) DESC
        """)
    List<Object[]> findReportSummaryGroupByQuestionAndStatus(@Param("status") ReportStatus status);
}
```

---

## Task 4: SubmissionRepository — 소급 보정 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java`

- [ ] **Step 1: 소급 보정 bulk update 쿼리 추가**

기존 `SubmissionRepository` 인터페이스에 다음 메서드 2개를 추가:

```java
// 문제 전체 기준 오답 제출 보정
@Modifying
@Query("UPDATE Submission s SET s.isCorrect = true WHERE s.questionUuid = :questionUuid AND s.isCorrect = false")
int correctAllByQuestionUuid(@Param("questionUuid") UUID questionUuid);

// 선택지 세트 기준 오답 제출 보정
@Modifying
@Query("UPDATE Submission s SET s.isCorrect = true WHERE s.choiceSetUuid = :choiceSetUuid AND s.isCorrect = false")
int correctAllByChoiceSetUuid(@Param("choiceSetUuid") UUID choiceSetUuid);
```

필요한 import도 추가:
```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
```

---

## Task 5: QuestionReportService (PQL-Application)

**Files:**
- Create: `server/PQL-Application/src/main/java/com/passql/application/service/QuestionReportService.java`

- [ ] **Step 1: QuestionReportService 작성**

`server/PQL-Application/src/main/java/com/passql/application/service/QuestionReportService.java`:

```java
package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionReport;
import com.passql.question.entity.enums.CorrectionScope;
import com.passql.question.entity.enums.ReportCategory;
import com.passql.question.entity.enums.ReportStatus;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuestionReportRepository;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionReportService {

    private final QuestionReportRepository questionReportRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;

    /** 사용자 신고 제출 */
    @Transactional
    public void submitReport(UUID questionUuid, UUID memberUuid, UUID submissionUuid,
                             UUID choiceSetUuid, List<ReportCategory> categories, String detail) {
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

    /** 신고 여부 조회 */
    public boolean isReported(UUID memberUuid, UUID submissionUuid) {
        return questionReportRepository.existsByMemberUuidAndSubmissionUuid(memberUuid, submissionUuid);
    }

    /** 관리자: 문제별 집계 목록 */
    public List<Object[]> getReportSummaries(ReportStatus status) {
        if (status != null) {
            return questionReportRepository.findReportSummaryGroupByQuestionAndStatus(status);
        }
        return questionReportRepository.findReportSummaryGroupByQuestion();
    }

    /** 관리자: 특정 문제 신고 건 목록 */
    public List<QuestionReport> getReportsByQuestion(UUID questionUuid) {
        return questionReportRepository.findByQuestionUuidOrderByCreatedAtDesc(questionUuid);
    }

    /** 관리자: 신고 처리 (resolve) */
    @Transactional
    public void resolveReport(UUID reportUuid, UUID adminMemberUuid,
                              CorrectionScope correctionScope, Boolean deactivateQuestion) {
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
            Question question = questionRepository.findById(report.getQuestionUuid())
                    .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
            question.deactivate();
        }

        // 3. Submission 소급 보정
        if (correctionScope == CorrectionScope.QUESTION_WIDE) {
            submissionRepository.correctAllByQuestionUuid(report.getQuestionUuid());
        } else if (correctionScope == CorrectionScope.CHOICE_SET_ONLY) {
            submissionRepository.correctAllByChoiceSetUuid(report.getChoiceSetUuid());
        }
    }
}
```

- [ ] **Step 2: Question 엔티티에 deactivate() 메서드 추가**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java`에 다음 메서드 추가:

```java
public void deactivate() {
    this.isActive = false;
}
```

---

## Task 6: 사용자 API — DTO + Controller

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportRequest.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportStatusResponse.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionReportController.java`

- [ ] **Step 1: ReportRequest DTO 작성**

`server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportRequest.java`:

```java
package com.passql.web.dto.report;

import com.passql.question.entity.enums.ReportCategory;

import java.util.List;
import java.util.UUID;

public record ReportRequest(
        UUID choiceSetUuid,        // nullable
        UUID submissionUuid,       // 필수
        List<ReportCategory> categories,  // 최소 1개
        String detail              // ETC 선택 시 필수
) {}
```

- [ ] **Step 2: ReportStatusResponse DTO 작성**

`server/PQL-Web/src/main/java/com/passql/web/dto/report/ReportStatusResponse.java`:

```java
package com.passql.web.dto.report;

public record ReportStatusResponse(boolean reported) {}
```

- [ ] **Step 3: QuestionReportController 작성**

`server/PQL-Web/src/main/java/com/passql/web/controller/QuestionReportController.java`:

```java
package com.passql.web.controller;

import com.passql.application.service.QuestionReportService;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.entity.enums.ReportCategory;
import com.passql.web.dto.report.ReportRequest;
import com.passql.web.dto.report.ReportStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/questions/{questionUuid}/report")
public class QuestionReportController {

    private final QuestionReportService questionReportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void submitReport(
            @PathVariable UUID questionUuid,
            @RequestHeader("X-Member-UUID") UUID memberUuid,
            @RequestBody ReportRequest request) {

        if (request.categories() == null || request.categories().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (request.categories().contains(ReportCategory.ETC)
                && (request.detail() == null || request.detail().isBlank())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }
        if (request.submissionUuid() == null) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        questionReportService.submitReport(
                questionUuid,
                memberUuid,
                request.submissionUuid(),
                request.choiceSetUuid(),
                request.categories(),
                request.detail()
        );
    }

    @GetMapping("/status")
    public ReportStatusResponse getReportStatus(
            @PathVariable UUID questionUuid,
            @RequestHeader("X-Member-UUID") UUID memberUuid,
            @RequestParam UUID submissionUuid) {

        boolean reported = questionReportService.isReported(memberUuid, submissionUuid);
        return new ReportStatusResponse(reported);
    }
}
```

---

## Task 7: 관리자 API — DTO + Controller

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportSummary.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportDetailResponse.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/dto/report/ResolveRequest.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminReportController.java`

- [ ] **Step 1: AdminReportSummary DTO 작성**

`server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportSummary.java`:

```java
package com.passql.web.dto.report;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record AdminReportSummary(
        UUID questionUuid,
        String questionStem,
        long totalCount,
        long pendingCount,
        Map<String, Long> categoryDistribution,
        LocalDateTime latestReportedAt
) {}
```

- [ ] **Step 2: AdminReportDetailResponse DTO 작성**

`server/PQL-Web/src/main/java/com/passql/web/dto/report/AdminReportDetailResponse.java`:

```java
package com.passql.web.dto.report;

import com.passql.question.entity.enums.ReportCategory;
import com.passql.question.entity.enums.ReportStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminReportDetailResponse(
        QuestionInfo question,
        List<ReportItem> reports
) {
    public record QuestionInfo(UUID questionUuid, String stem, Boolean isActive) {}

    public record ReportItem(
            UUID reportUuid,
            UUID memberUuid,
            UUID submissionUuid,
            UUID choiceSetUuid,
            List<ReportCategory> categories,
            String detail,
            ReportStatus status,
            LocalDateTime createdAt
    ) {}
}
```

- [ ] **Step 3: ResolveRequest DTO 작성**

`server/PQL-Web/src/main/java/com/passql/web/dto/report/ResolveRequest.java`:

```java
package com.passql.web.dto.report;

import com.passql.question.entity.enums.CorrectionScope;

public record ResolveRequest(
        CorrectionScope correctionScope,
        Boolean deactivateQuestion
) {}
```

- [ ] **Step 4: AdminReportController 작성**

`server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminReportController.java`:

```java
package com.passql.web.controller.admin;

import com.passql.application.service.QuestionReportService;
import com.passql.question.entity.QuestionReport;
import com.passql.question.entity.enums.ReportCategory;
import com.passql.question.entity.enums.ReportStatus;
import com.passql.question.repository.QuestionRepository;
import com.passql.web.dto.report.AdminReportDetailResponse;
import com.passql.web.dto.report.AdminReportSummary;
import com.passql.web.dto.report.ResolveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api/reports")
public class AdminReportController {

    private final QuestionReportService questionReportService;
    private final QuestionRepository questionRepository;

    @GetMapping
    public ResponseEntity<List<AdminReportSummary>> getReportSummaries(
            @RequestParam(required = false) ReportStatus status) {

        List<Object[]> rows = questionReportService.getReportSummaries(status);

        List<AdminReportSummary> result = rows.stream().map(row -> {
            UUID questionUuid = (UUID) row[0];
            long totalCount = ((Number) row[1]).longValue();
            long pendingCount = ((Number) row[2]).longValue();
            LocalDateTime latestReportedAt = (LocalDateTime) row[3];

            String stem = questionRepository.findById(questionUuid)
                    .map(q -> q.getStem())
                    .orElse("(삭제된 문제)");

            // 카테고리 분포는 별도 쿼리 없이 상세에서 확인 (목록은 간략히)
            return new AdminReportSummary(questionUuid, stem, totalCount, pendingCount,
                    Map.of(), latestReportedAt);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{questionUuid}")
    public ResponseEntity<AdminReportDetailResponse> getReportDetail(
            @PathVariable UUID questionUuid) {

        var question = questionRepository.findById(questionUuid)
                .orElseThrow();
        List<QuestionReport> reports = questionReportService.getReportsByQuestion(questionUuid);

        var questionInfo = new AdminReportDetailResponse.QuestionInfo(
                question.getQuestionUuid(), question.getStem(), question.getIsActive());

        List<AdminReportDetailResponse.ReportItem> reportItems = reports.stream()
                .map(r -> new AdminReportDetailResponse.ReportItem(
                        r.getQuestionReportUuid(), r.getMemberUuid(), r.getSubmissionUuid(),
                        r.getChoiceSetUuid(), r.getCategories(), r.getDetail(),
                        r.getStatus(), r.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(new AdminReportDetailResponse(questionInfo, reportItems));
    }

    @PostMapping("/{reportUuid}/resolve")
    public ResponseEntity<Void> resolveReport(
            @PathVariable UUID reportUuid,
            @RequestHeader("X-Member-UUID") UUID adminMemberUuid,
            @RequestBody ResolveRequest request) {

        questionReportService.resolveReport(
                reportUuid, adminMemberUuid,
                request.correctionScope(), request.deactivateQuestion());

        return ResponseEntity.ok().build();
    }
}
```

---

## Task 8: 관리자 Thymeleaf 화면

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/reports.html`
- Create: `server/PQL-Web/src/main/resources/templates/admin/report-detail.html`
- Modify: 기존 admin nav에 Reports 메뉴 추가 (사이드바/네비 파일 확인 후 추가)

- [ ] **Step 1: 기존 admin layout/nav 파일 확인**

다음 경로를 확인하여 nav fragment가 어디 있는지 파악:
```
server/PQL-Web/src/main/resources/templates/admin/
```
`layout.html` 또는 `fragments/nav.html` 등에서 기존 메뉴 항목을 보고, 동일한 패턴으로 Reports 링크 추가.

- [ ] **Step 2: reports.html 작성 (문제별 집계 목록)**

`server/PQL-Web/src/main/resources/templates/admin/reports.html`:

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{admin/layout :: head('신고 관리')}"></head>
<body>
<div th:replace="~{admin/layout :: sidebar}"></div>
<main class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-bold">신고 관리</h1>
    <label class="flex items-center gap-2 cursor-pointer">
      <span class="text-sm">미처리만 보기</span>
      <input type="checkbox" id="pendingOnly" class="toggle toggle-primary" checked
             onchange="filterReports(this.checked)"/>
    </label>
  </div>

  <div class="overflow-x-auto">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th>신고 수</th>
          <th>문제</th>
          <th>미처리</th>
          <th>최근 신고일</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="reportTableBody">
        <!-- JS로 렌더링 -->
      </tbody>
    </table>
  </div>
</main>

<script>
let allReports = [];

async function loadReports(pendingOnly) {
  const status = pendingOnly ? '?status=PENDING' : '';
  const res = await fetch(`/admin/api/reports${status}`);
  allReports = await res.json();
  renderTable(allReports);
}

function renderTable(reports) {
  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = reports.map(r => `
    <tr class="cursor-pointer hover" onclick="location.href='/admin/reports/${r.questionUuid}'">
      <td><span class="badge badge-neutral">${r.totalCount}</span></td>
      <td class="max-w-xs truncate">${r.questionStem}</td>
      <td>${r.pendingCount > 0 ? '<span class="badge badge-warning">' + r.pendingCount + ' 미처리</span>' : '<span class="badge badge-success">처리완료</span>'}</td>
      <td>${r.latestReportedAt ? new Date(r.latestReportedAt).toLocaleDateString('ko-KR') : '-'}</td>
      <td><a href="/admin/reports/${r.questionUuid}" class="btn btn-xs btn-outline">상세</a></td>
    </tr>
  `).join('');
}

function filterReports(pendingOnly) {
  loadReports(pendingOnly);
}

// 초기 로드 (미처리만)
loadReports(true);
</script>
</body>
</html>
```

- [ ] **Step 3: report-detail.html 작성 (신고 상세)**

`server/PQL-Web/src/main/resources/templates/admin/report-detail.html`:

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{admin/layout :: head('신고 상세')}"></head>
<body>
<div th:replace="~{admin/layout :: sidebar}"></div>
<main class="p-6 max-w-4xl">
  <a href="/admin/reports" class="btn btn-ghost btn-sm mb-4">← 목록으로</a>

  <div id="questionInfo" class="card bg-base-200 mb-6 p-4"></div>

  <h2 class="text-xl font-semibold mb-3">신고 목록</h2>
  <div id="reportList" class="flex flex-col gap-3 mb-8"></div>

  <div class="card bg-base-100 border border-base-300 p-4">
    <h3 class="font-semibold mb-3">일괄 처리 (미처리 전체)</h3>
    <div class="form-control mb-2">
      <label class="label font-medium">보정 범위</label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="correctionScope" value="NONE" class="radio radio-sm" checked/> 없음
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="correctionScope" value="QUESTION_WIDE" class="radio radio-sm"/> 문제 전체
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="correctionScope" value="CHOICE_SET_ONLY" class="radio radio-sm"/> 선택지 세트 기준
        </label>
      </div>
    </div>
    <label class="flex items-center gap-2 cursor-pointer mb-4">
      <input type="checkbox" id="deactivateQuestion" class="checkbox checkbox-sm"/>
      <span>문제 비활성화</span>
    </label>
    <button onclick="resolveAllPending()" class="btn btn-primary btn-sm">미처리 전체 처리완료</button>
  </div>
</main>

<script>
const questionUuid = location.pathname.split('/').pop();
let reports = [];

async function loadDetail() {
  const res = await fetch(`/admin/api/reports/${questionUuid}`);
  const data = await res.json();

  document.getElementById('questionInfo').innerHTML = `
    <p class="font-semibold text-base mb-1">문제: ${data.question.stem}</p>
    <p class="text-sm text-base-content/60">상태: ${data.question.isActive ? '활성' : '비활성'}</p>
  `;

  reports = data.reports;
  document.getElementById('reportList').innerHTML = reports.map((r, i) => `
    <div class="card bg-base-100 border border-base-300 p-4">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex gap-2 flex-wrap mb-1">
            ${r.categories.map(c => `<span class="badge badge-outline badge-sm">${categoryLabel(c)}</span>`).join('')}
          </div>
          ${r.detail ? `<p class="text-sm text-base-content/70 mt-1">"${r.detail}"</p>` : ''}
          <p class="text-xs text-base-content/40 mt-1">${new Date(r.createdAt).toLocaleString('ko-KR')}</p>
        </div>
        <span class="badge ${r.status === 'PENDING' ? 'badge-warning' : 'badge-success'} badge-sm">
          ${r.status === 'PENDING' ? '미처리' : '처리완료'}
        </span>
      </div>
    </div>
  `).join('');
}

function categoryLabel(cat) {
  const map = {
    WRONG_ANSWER: '정답 오류', WEIRD_QUESTION: '문제 오류',
    WEIRD_CHOICES: '선택지 오류', WEIRD_EXECUTION: '실행 결과 오류', ETC: '기타'
  };
  return map[cat] || cat;
}

async function resolveAllPending() {
  const correctionScope = document.querySelector('input[name="correctionScope"]:checked').value;
  const deactivateQuestion = document.getElementById('deactivateQuestion').checked;

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  for (const r of pendingReports) {
    await fetch(`/admin/api/reports/${r.reportUuid}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Member-UUID': 'admin' },
      body: JSON.stringify({ correctionScope, deactivateQuestion })
    });
  }
  alert('처리 완료되었습니다.');
  loadDetail();
}

loadDetail();
</script>
</body>
</html>
```

- [ ] **Step 4: Admin nav에 Reports 링크 추가**

admin layout/sidebar 파일을 확인 후, 기존 메뉴 항목 패턴 그대로 다음 링크 추가:
```html
<a href="/admin/reports" class="...">신고 관리</a>
```

- [ ] **Step 5: AdminReportController에 페이지 라우팅 메서드 추가**

`AdminReportController`에 Thymeleaf 뷰 반환 메서드 2개 추가 (기존 REST API와 별도 Controller로 분리하거나 같은 파일에 추가):

```java
// 별도 Controller: AdminReportViewController.java
@Controller
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportViewController {

    @GetMapping
    public String reportsPage() {
        return "admin/reports";
    }

    @GetMapping("/{questionUuid}")
    public String reportDetailPage(@PathVariable UUID questionUuid) {
        return "admin/report-detail";
    }
}
```

→ 파일: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminReportViewController.java`

---

## Task 9: 프론트엔드 — 신고 API 클라이언트

**Files:**
- Create: `client/src/api/reports.ts`

- [ ] **Step 1: reports.ts API 클라이언트 작성**

`client/src/api/reports.ts`:

```typescript
import { apiFetch } from './client';

export type ReportCategory =
  | 'WRONG_ANSWER'
  | 'WEIRD_QUESTION'
  | 'WEIRD_CHOICES'
  | 'WEIRD_EXECUTION'
  | 'ETC';

export interface ReportRequest {
  choiceSetUuid?: string;
  submissionUuid: string;
  categories: ReportCategory[];
  detail?: string;
}

export interface ReportStatusResponse {
  reported: boolean;
}

export async function submitReport(
  questionUuid: string,
  memberUuid: string,
  request: ReportRequest
): Promise<void> {
  await apiFetch<void>(`/api/questions/${questionUuid}/report`, {
    method: 'POST',
    headers: { 'X-Member-UUID': memberUuid, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function getReportStatus(
  questionUuid: string,
  memberUuid: string,
  submissionUuid: string
): Promise<ReportStatusResponse> {
  return apiFetch<ReportStatusResponse>(
    `/api/questions/${questionUuid}/report/status?submissionUuid=${submissionUuid}`,
    { headers: { 'X-Member-UUID': memberUuid } }
  );
}
```

---

## Task 10: 프론트엔드 — ReportModal 컴포넌트

**Files:**
- Create: `client/src/components/ReportModal.tsx`

- [ ] **Step 1: ReportModal 컴포넌트 작성**

`client/src/components/ReportModal.tsx`:

```tsx
import { useState } from 'react';
import { submitReport, ReportCategory } from '../api/reports';
import { useMemberStore } from '../stores/memberStore';

interface ReportModalProps {
  questionUuid: string;
  submissionUuid: string;
  choiceSetUuid?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'WRONG_ANSWER', label: '정답이 틀렸다' },
  { value: 'WEIRD_QUESTION', label: '문제 자체가 이상하다' },
  { value: 'WEIRD_CHOICES', label: '선택지가 이상하다' },
  { value: 'WEIRD_EXECUTION', label: 'SQL 실행 결과가 이상하다' },
  { value: 'ETC', label: '기타' },
];

export default function ReportModal({
  questionUuid,
  submissionUuid,
  choiceSetUuid,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const memberUuid = useMemberStore((s) => s.memberUuid);
  const [selected, setSelected] = useState<Set<ReportCategory>>(new Set());
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (cat: ReportCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const canSubmit =
    selected.size > 0 &&
    (!selected.has('ETC') || detail.trim().length > 0) &&
    !loading;

  const handleSubmit = async () => {
    if (!memberUuid || !canSubmit) return;
    setLoading(true);
    try {
      await submitReport(questionUuid, memberUuid, {
        submissionUuid,
        choiceSetUuid,
        categories: [...selected],
        detail: selected.has('ETC') ? detail.trim() : undefined,
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">문제 신고</h3>
        <div className="flex flex-col gap-3 mb-4">
          {CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={selected.has(value)}
                onChange={() => toggle(value)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          {selected.has('ETC') && (
            <textarea
              className="textarea textarea-bordered text-sm mt-1"
              placeholder="구체적인 내용을 입력해주세요"
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          )}
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? <span className="loading loading-spinner loading-xs" /> : '신고하기'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
```

---

## Task 11: 프론트엔드 — PracticeResult에 신고 버튼 통합

**Files:**
- Modify: `client/src/pages/PracticeResult.tsx`

- [ ] **Step 1: PracticeResult.tsx 파일 읽기**

수정 전 반드시 파일 전체를 읽어서 정확한 라인 위치 파악 후 편집.

- [ ] **Step 2: import 추가**

파일 상단 import 영역에 추가:

```typescript
import { useState } from 'react';
import ReportModal from '../components/ReportModal';
import { getReportStatus } from '../api/reports';
import { useQuery } from '@tanstack/react-query';
import { useMemberStore } from '../stores/memberStore';
```

- [ ] **Step 3: 신고 상태 관리 + 모달 상태 추가**

컴포넌트 내부에 다음 상태 추가:

```typescript
const memberUuid = useMemberStore((s) => s.memberUuid);
const [reportModalTarget, setReportModalTarget] = useState<{
  questionUuid: string;
  submissionUuid: string;
  choiceSetUuid?: string;
} | null>(null);
const [reportedSubmissions, setReportedSubmissions] = useState<Set<string>>(new Set());
```

- [ ] **Step 4: 문제 카드 내 신고 버튼 추가**

PracticeResult의 문제 카드 렌더링 부분(다시 풀기 링크 근처)에 신고 버튼 추가:

```tsx
<button
  className={`btn btn-ghost btn-xs text-error ${
    reportedSubmissions.has(item.submissionUuid) ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  disabled={reportedSubmissions.has(item.submissionUuid)}
  onClick={() => {
    if (!reportedSubmissions.has(item.submissionUuid)) {
      setReportModalTarget({
        questionUuid: item.questionUuid,
        submissionUuid: item.submissionUuid,
        choiceSetUuid: item.choiceSetUuid,
      });
    }
  }}
>
  {reportedSubmissions.has(item.submissionUuid) ? '신고 완료' : '신고'}
</button>
```

- [ ] **Step 5: ReportModal 렌더링 추가**

컴포넌트 return 문 최하단(닫는 태그 직전)에 추가:

```tsx
{reportModalTarget && (
  <ReportModal
    questionUuid={reportModalTarget.questionUuid}
    submissionUuid={reportModalTarget.submissionUuid}
    choiceSetUuid={reportModalTarget.choiceSetUuid}
    onClose={() => setReportModalTarget(null)}
    onSuccess={() => {
      setReportedSubmissions((prev) => new Set([...prev, reportModalTarget.submissionUuid]));
      setReportModalTarget(null);
      // toast
      const toast = document.createElement('div');
      toast.className = 'toast toast-top toast-end z-50';
      toast.innerHTML = '<div class="alert alert-success"><span>신고가 접수되었습니다.</span></div>';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }}
  />
)}
```

---

## Task 12: 자체 검증

- [ ] **Step 1: 서버 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Question:compileJava :PQL-Application:compileJava :PQL-Web:compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 2: 프론트엔드 타입 체크**

```bash
cd client
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 서버 기동 후 API 확인 (수동)**

```
POST /api/questions/{questionUuid}/report
  → 201 Created

GET /api/questions/{questionUuid}/report/status?submissionUuid={uuid}
  → { "reported": false }

GET /admin/api/reports
  → 집계 목록 JSON

POST /admin/api/reports/{reportUuid}/resolve
  → 200 OK, DB에 status=RESOLVED, correctionScope 세팅 확인
```

- [ ] **Step 4: 프론트엔드 확인**

PracticeResult 화면에서:
1. 신고 버튼 클릭 → 모달 등장
2. 카테고리 선택 없이 신고하기 → 버튼 비활성 상태 유지
3. ETC 선택 → textarea 표시
4. 신고 제출 → toast 표시, 버튼 "신고 완료"로 변경
5. 재클릭 시 버튼 비활성

---

## Self-Review

**스펙 커버리지 체크:**
- [x] 사용자 신고 제출 API → Task 6
- [x] 신고 여부 조회 API → Task 6
- [x] 관리자 집계 목록 API → Task 7
- [x] 관리자 신고 상세 API → Task 7
- [x] 관리자 resolve API (상태변경 + 비활성화 + 보정) → Task 5, 7
- [x] 프론트엔드 신고 모달 → Task 10
- [x] 관리자 신고 관리 화면 → Task 8
- [x] CHOICE_SET_ONLY 시 choiceSetUuid null 체크 → Task 5 (REPORT_CHOICE_SET_REQUIRED)
- [x] 중복 신고 방지 → Task 5 (REPORT_ALREADY_EXISTS)
- [x] ETC 선택 시 detail 필수 → Task 6 (Controller 검증) + Task 10 (프론트 canSubmit)
- [x] Flyway 마이그레이션 → Task 1
- [x] Question.deactivate() → Task 5

**타입 일관성 체크:**
- `QuestionReport.resolve(UUID, CorrectionScope)` → Task 2에서 정의, Task 5에서 호출 ✓
- `SubmissionRepository.correctAllByQuestionUuid(UUID)` → Task 4 정의, Task 5 호출 ✓
- `AdminReportDetailResponse.ReportItem` 필드 → Task 7 정의, AdminReportController 매핑 ✓
- `ReportCategory` enum → Task 1 정의, Task 6/9/10 모두 동일 타입 ✓
