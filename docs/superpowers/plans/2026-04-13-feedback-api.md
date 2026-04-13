# Feedback API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 건의사항 제출(POST /feedback) 및 내 건의사항 목록 조회(GET /feedback/me) API를 구현한다.

**Architecture:** `PQL-Domain-Meta` 모듈에 `Feedback` 엔티티/레포지토리/서비스를 추가하고, `PQL-Web` 모듈에 Controller를 추가한다. 회원 식별은 `X-Member-UUID` 헤더로 처리하며, 회원 존재 여부는 `MemberRepository`로 검증한다. Flyway 마이그레이션으로 `feedback` 테이블을 생성한다.

**Tech Stack:** Spring Boot 3.4.4, JPA/Hibernate, MariaDB, Flyway, Lombok, SpringDoc OpenAPI

---

## File Map

| 역할 | 파일 경로 | 생성/수정 |
|------|----------|---------|
| Enum | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/constant/FeedbackStatus.java` | 생성 |
| Entity | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/Feedback.java` | 생성 |
| Repository | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/FeedbackRepository.java` | 생성 |
| DTO (요청) | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackSubmitRequest.java` | 생성 |
| DTO (제출 응답) | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackSubmitResponse.java` | 생성 |
| DTO (목록 응답) | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackListResponse.java` | 생성 |
| Service | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/FeedbackService.java` | 생성 |
| Controller | `server/PQL-Web/src/main/java/com/passql/web/controller/FeedbackController.java` | 생성 |
| Controller Docs | `server/PQL-Web/src/main/java/com/passql/web/controller/FeedbackControllerDocs.java` | 생성 |
| ErrorCode | `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` | 수정 |
| Migration | `server/PQL-Web/src/main/resources/db/migration/V0_0_115__add_feedback_table.sql` | 생성 |

---

## Task 1: FeedbackStatus enum 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/constant/FeedbackStatus.java`

- [ ] **Step 1: FeedbackStatus enum 파일 생성**

```java
package com.passql.meta.constant;

public enum FeedbackStatus {
    PENDING,    // 접수됨, 미확인 (노란 pill)
    REVIEWED,   // 팀에서 확인함 (인디고 pill)
    APPLIED     // 반영 완료 (초록 pill)
}
```

---

## Task 2: Feedback 엔티티 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/entity/Feedback.java`

- [ ] **Step 1: Feedback 엔티티 파일 생성**

```java
package com.passql.meta.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.meta.constant.FeedbackStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
    name = "feedback",
    indexes = {
        @Index(name = "idx_feedback_member_uuid", columnList = "member_uuid"),
        @Index(name = "idx_feedback_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Feedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID feedbackUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false, length = 500)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackStatus status;
}
```

---

## Task 3: Flyway 마이그레이션 파일 추가

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_115__add_feedback_table.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
CREATE TABLE IF NOT EXISTS feedback (
    feedback_uuid CHAR(36)     NOT NULL,
    member_uuid   CHAR(36)     NOT NULL,
    content       VARCHAR(500) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at    DATETIME(6)  NULL,
    updated_at    DATETIME(6)  NULL,
    created_by    VARCHAR(255) NULL,
    updated_by    VARCHAR(255) NULL,
    PRIMARY KEY (feedback_uuid)
);

CREATE INDEX IF NOT EXISTS idx_feedback_member_uuid ON feedback (member_uuid);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at  ON feedback (created_at);
```

---

## Task 4: ErrorCode 추가

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: ErrorCode enum에 Feedback 카테고리 추가**

`EXPORT_NO_DATA` 항목 바로 앞에 다음 두 줄을 추가한다:

```java
    // Feedback
    FEEDBACK_CONTENT_EMPTY(HttpStatus.BAD_REQUEST, "건의사항 내용을 입력해 주세요."),
    FEEDBACK_CONTENT_TOO_LONG(HttpStatus.BAD_REQUEST, "건의사항은 500자 이하로 입력해 주세요."),

    // === Import/Export ===
    IMPORT_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "한 번에 최대 100건까지 가져올 수 있습니다."),
    EXPORT_NO_DATA(HttpStatus.NOT_FOUND, "내보낼 문제가 없습니다.");
```

---

## Task 5: DTO 3종 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackSubmitRequest.java`
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackSubmitResponse.java`
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackListResponse.java`

- [ ] **Step 1: FeedbackSubmitRequest 생성**

```java
package com.passql.meta.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FeedbackSubmitRequest {

    private String content;
}
```

- [ ] **Step 2: FeedbackSubmitResponse 생성**

```java
package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackSubmitResponse {

    private UUID feedbackUuid;
    private String status;
    private LocalDateTime createdAt;

    public static FeedbackSubmitResponse from(Feedback f) {
        return new FeedbackSubmitResponse(
            f.getFeedbackUuid(),
            f.getStatus().name(),
            f.getCreatedAt()
        );
    }
}
```

- [ ] **Step 3: FeedbackListResponse 생성**

```java
package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackListResponse {

    private List<FeedbackItem> items;

    @Getter
    @AllArgsConstructor
    public static class FeedbackItem {
        private UUID feedbackUuid;
        private String content;
        private String status;
        private LocalDateTime createdAt;

        public static FeedbackItem from(Feedback f) {
            return new FeedbackItem(
                f.getFeedbackUuid(),
                f.getContent(),
                f.getStatus().name(),
                f.getCreatedAt()
            );
        }
    }

    public static FeedbackListResponse of(List<Feedback> feedbacks) {
        List<FeedbackItem> items = feedbacks.stream()
            .map(FeedbackItem::from)
            .toList();
        return new FeedbackListResponse(items);
    }
}
```

---

## Task 6: FeedbackRepository 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/FeedbackRepository.java`

- [ ] **Step 1: FeedbackRepository 생성**

```java
package com.passql.meta.repository;

import com.passql.meta.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByMemberUuidOrderByCreatedAtDesc(UUID memberUuid);
}
```

---

## Task 7: FeedbackService 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/FeedbackService.java`

`MemberRepository`를 주입해 회원 존재 여부를 검증한다. `PQL-Domain-Meta`는 `PQL-Domain-Member`를 의존하지 않으므로, **회원 검증은 `memberUuid`가 null이거나 빈 값인지만 체크**하고 실제 존재 여부는 Controller 단에서 `MemberRepository`를 사용하지 않아도 된다 — `X-Member-UUID` 헤더가 없으면 Spring이 400을 반환하므로 UUID 자체가 null이 될 수 없다. Service에서는 content 유효성만 검증한다.

- [ ] **Step 1: FeedbackService 생성**

```java
package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.entity.Feedback;
import com.passql.meta.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Transactional
    public FeedbackSubmitResponse submit(UUID memberUuid, FeedbackSubmitRequest request) {
        String content = request.getContent();

        if (content == null || content.isBlank()) {
            throw new CustomException(ErrorCode.FEEDBACK_CONTENT_EMPTY);
        }
        if (content.length() > 500) {
            throw new CustomException(ErrorCode.FEEDBACK_CONTENT_TOO_LONG);
        }

        Feedback feedback = Feedback.builder()
            .memberUuid(memberUuid)
            .content(content.trim())
            .status(FeedbackStatus.PENDING)
            .build();

        Feedback saved = feedbackRepository.save(feedback);
        log.info("[FeedbackService] 건의사항 제출 완료: feedbackUuid={}, memberUuid={}", saved.getFeedbackUuid(), memberUuid);
        return FeedbackSubmitResponse.from(saved);
    }

    public FeedbackListResponse getMyFeedbacks(UUID memberUuid) {
        List<Feedback> feedbacks = feedbackRepository.findByMemberUuidOrderByCreatedAtDesc(memberUuid);
        return FeedbackListResponse.of(feedbacks);
    }
}
```

---

## Task 8: FeedbackControllerDocs 추가

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/FeedbackControllerDocs.java`

- [ ] **Step 1: FeedbackControllerDocs 인터페이스 생성**

```java
package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@Tag(name = "Feedback", description = "건의사항 제출 / 내 건의사항 목록 조회")
public interface FeedbackControllerDocs {

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 200, description = "건의사항 제출 API 추가"),
    })
    @Operation(
        summary = "건의사항 제출",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 요청 바디 (FeedbackSubmitRequest)
            - **`content`**: 건의사항 내용 (1자 이상 500자 이하, 필수)

            ## 반환값 (FeedbackSubmitResponse)
            - **`feedbackUuid`**: 생성된 건의사항 UUID
            - **`status`**: 초기 상태 (항상 PENDING)
            - **`createdAt`**: 생성 시각

            ## 에러
            - 400: content가 비어 있거나 500자 초과
            """
    )
    FeedbackSubmitResponse submit(
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestBody FeedbackSubmitRequest request
    );

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 200, description = "내 건의사항 목록 조회 API 추가"),
    })
    @Operation(
        summary = "내 건의사항 목록 조회",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 반환값 (FeedbackListResponse)
            - **`items`**: 건의사항 목록 (createdAt 내림차순)
              - **`feedbackUuid`**: 건의사항 UUID
              - **`content`**: 내용
              - **`status`**: PENDING / REVIEWED / APPLIED
              - **`createdAt`**: 생성 시각

            ## 에러
            - 건의사항이 없으면 200 + { "items": [] } 반환 (404 금지)
            """
    )
    FeedbackListResponse getMyFeedbacks(
        @RequestHeader("X-Member-UUID") UUID memberUuid
    );
}
```

---

## Task 9: FeedbackController 추가

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/FeedbackController.java`

- [ ] **Step 1: FeedbackController 생성**

```java
package com.passql.web.controller;

import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController implements FeedbackControllerDocs {

    private final FeedbackService feedbackService;

    @PostMapping
    public FeedbackSubmitResponse submit(
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestBody FeedbackSubmitRequest request
    ) {
        return feedbackService.submit(memberUuid, request);
    }

    @GetMapping("/me")
    public FeedbackListResponse getMyFeedbacks(
        @RequestHeader("X-Member-UUID") UUID memberUuid
    ) {
        return feedbackService.getMyFeedbacks(memberUuid);
    }
}
```

---

## Self-Review

### 스펙 커버리지

| 요구사항 | Task |
|---------|------|
| POST /feedback — content 유효성 (1~500자) | Task 4 (ErrorCode), Task 7 (Service) |
| POST /feedback — 응답: feedbackUuid, status, createdAt | Task 5 (FeedbackSubmitResponse) |
| GET /feedback/me — createdAt DESC 정렬 | Task 6 (Repository) |
| GET /feedback/me — 빈 목록 시 200 + items:[] | Task 7 (Service: 빈 List 반환) |
| FeedbackStatus PENDING/REVIEWED/APPLIED | Task 1 |
| X-Member-UUID 헤더 기반 회원 식별 | Task 8, 9 (Controller) |
| Flyway 마이그레이션 feedback 테이블 | Task 3 |

### 타입 일관성

- `FeedbackSubmitResponse.from(Feedback f)` → `f.getCreatedAt()` — `BaseEntity`의 `createdAt`은 `LocalDateTime` 타입 ✓
- `FeedbackListResponse.of(List<Feedback>)` → `FeedbackItem.from()` 호출 ✓
- `FeedbackRepository.findByMemberUuidOrderByCreatedAtDesc(UUID)` → Service에서 동일 시그니처 호출 ✓
- `ErrorCode.FEEDBACK_CONTENT_EMPTY`, `FEEDBACK_CONTENT_TOO_LONG` — Task 4에서 정의, Task 7에서 사용 ✓
