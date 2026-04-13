# Admin Feedback Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 전체 건의사항을 조회하고 상태를 변경할 수 있는 관리자 화면을 추가하고, 회원 목록의 눈깔 아이콘을 행 클릭 방식으로 교체한다.

**Architecture:** `PQL-Domain-Meta`의 `FeedbackService`/`FeedbackRepository`에 관리자용 메서드를 추가하고, `PQL-Web`에 `AdminFeedbackController`와 `feedbacks.html` Thymeleaf 페이지를 신규 생성한다. 상태 변경은 fetch POST + `@ResponseBody` 방식으로 처리한다 (기존 `AdminExamScheduleController` 패턴 동일). 회원 목록은 `members/list.html`에서 눈깔 아이콘 버튼 제거 + 행 클릭 이동으로 교체한다.

**Tech Stack:** Spring Boot 3.4.4, Thymeleaf + Layout Dialect, DaisyUI 5, Tailwind CSS 4, Lucide Icons, JPA Page

---

## File Map

| 역할 | 파일 경로 | 생성/수정 |
|------|----------|---------|
| ErrorCode | `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` | 수정 |
| Repository | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/FeedbackRepository.java` | 수정 |
| DTO (관리자 응답) | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackAdminResponse.java` | 생성 |
| DTO (상태 변경 요청) | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackStatusUpdateRequest.java` | 생성 |
| Service | `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/FeedbackService.java` | 수정 |
| Admin Controller | `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminFeedbackController.java` | 생성 |
| 사이드바 레이아웃 | `server/PQL-Web/src/main/resources/templates/admin/layout.html` | 수정 |
| 건의사항 관리 HTML | `server/PQL-Web/src/main/resources/templates/admin/feedbacks.html` | 생성 |
| 회원 목록 HTML | `server/PQL-Web/src/main/resources/templates/admin/members/list.html` | 수정 |

---

## Task 1: ErrorCode에 FEEDBACK_NOT_FOUND 추가

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: FEEDBACK_NOT_FOUND 추가**

현재 파일의 Feedback 카테고리 부분을 찾아 다음과 같이 수정한다:

```java
    // Feedback
    FEEDBACK_NOT_FOUND(HttpStatus.NOT_FOUND, "건의사항을 찾을 수 없습니다."),
    FEEDBACK_CONTENT_EMPTY(HttpStatus.BAD_REQUEST, "건의사항 내용을 입력해 주세요."),
    FEEDBACK_CONTENT_TOO_LONG(HttpStatus.BAD_REQUEST, "건의사항은 500자 이하로 입력해 주세요."),
```

---

## Task 2: FeedbackRepository에 페이지네이션 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/FeedbackRepository.java`

- [ ] **Step 1: Page 반환 메서드 추가**

```java
package com.passql.meta.repository;

import com.passql.meta.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByMemberUuidOrderByCreatedAtDesc(UUID memberUuid);

    Page<Feedback> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
```

---

## Task 3: FeedbackAdminResponse DTO 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackAdminResponse.java`

- [ ] **Step 1: FeedbackAdminResponse 생성**

```java
package com.passql.meta.dto;

import com.passql.meta.entity.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FeedbackAdminResponse {

    private UUID feedbackUuid;
    private UUID memberUuid;
    private String content;
    private String status;
    private LocalDateTime createdAt;

    public static FeedbackAdminResponse from(Feedback f) {
        return new FeedbackAdminResponse(
            f.getFeedbackUuid(),
            f.getMemberUuid(),
            f.getContent(),
            f.getStatus().name(),
            f.getCreatedAt()
        );
    }
}
```

---

## Task 4: FeedbackStatusUpdateRequest DTO 추가

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/FeedbackStatusUpdateRequest.java`

- [ ] **Step 1: FeedbackStatusUpdateRequest 생성**

```java
package com.passql.meta.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FeedbackStatusUpdateRequest {

    private String status;
}
```

---

## Task 5: FeedbackService에 관리자용 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/FeedbackService.java`

- [ ] **Step 1: getAllFeedbacks(), updateStatus() 추가**

기존 파일에 import 추가 및 두 메서드를 추가한다. 전체 파일:

```java
package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.dto.FeedbackAdminResponse;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import com.passql.meta.entity.Feedback;
import com.passql.meta.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        String trimmed = content.trim();

        if (trimmed.length() > 500) {
            throw new CustomException(ErrorCode.FEEDBACK_CONTENT_TOO_LONG);
        }

        Feedback feedback = Feedback.builder()
            .memberUuid(memberUuid)
            .content(trimmed)
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

    public Page<FeedbackAdminResponse> getAllFeedbacks(Pageable pageable) {
        return feedbackRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(FeedbackAdminResponse::from);
    }

    @Transactional
    public void updateStatus(UUID feedbackUuid, FeedbackStatus status) {
        Feedback feedback = feedbackRepository.findById(feedbackUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.FEEDBACK_NOT_FOUND));
        feedback.setStatus(status);
        log.info("[FeedbackService] 건의사항 상태 변경: feedbackUuid={}, status={}", feedbackUuid, status);
    }
}
```

---

## Task 6: AdminFeedbackController 추가

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminFeedbackController.java`

- [ ] **Step 1: AdminFeedbackController 생성**

```java
package com.passql.web.controller.admin;

import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.dto.FeedbackStatusUpdateRequest;
import com.passql.meta.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/admin/feedbacks")
@RequiredArgsConstructor
public class AdminFeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public String list(Model model,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedPage = Math.max(0, page);
        int clampedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        model.addAttribute("feedbacks", feedbackService.getAllFeedbacks(pageable));
        model.addAttribute("statuses", FeedbackStatus.values());
        model.addAttribute("pageTitle", "건의사항 관리");
        model.addAttribute("currentMenu", "feedbacks");
        return "admin/feedbacks";
    }

    @PostMapping("/{feedbackUuid}/status")
    @ResponseBody
    public ResponseEntity<Void> updateStatus(@PathVariable UUID feedbackUuid,
                                              @RequestBody FeedbackStatusUpdateRequest request) {
        FeedbackStatus status = FeedbackStatus.valueOf(request.getStatus());
        feedbackService.updateStatus(feedbackUuid, status);
        return ResponseEntity.ok().build();
    }
}
```

---

## Task 7: layout.html 사이드바에 건의사항 메뉴 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/layout.html`

- [ ] **Step 1: 시험 일정 메뉴 항목 다음에 건의사항 항목 추가**

현재 파일에서 아래 블록을 찾아:

```html
                <li>
                    <a th:href="@{/admin/exam-schedules}" th:classappend="${currentMenu == 'exam-schedules'} ? 'active'">
                        <i data-lucide="calendar-days" class="size-5"></i>
                        시험 일정
                    </a>
                </li>
                <li>
                    <a th:href="@{/admin/settings}" th:classappend="${currentMenu == 'settings'} ? 'active'">
```

사이에 다음을 삽입:

```html
                <li>
                    <a th:href="@{/admin/feedbacks}" th:classappend="${currentMenu == 'feedbacks'} ? 'active'">
                        <i data-lucide="message-circle" class="size-5"></i>
                        건의사항
                    </a>
                </li>
```

---

## Task 8: feedbacks.html Thymeleaf 페이지 생성

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/feedbacks.html`

- [ ] **Step 1: feedbacks.html 생성**

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{admin/layout}">

<th:block layout:fragment="title">건의사항 관리</th:block>

<th:block layout:fragment="content">

    <!-- 요약 배지 -->
    <div class="flex gap-2 mb-4">
        <div class="badge badge-warning badge-lg">
            PENDING <span class="ml-1 font-bold" th:text="${feedbacks.totalElements}">0</span>
        </div>
    </div>

    <!-- 건의사항 목록 -->
    <div class="card bg-base-100 shadow">
        <div class="card-body p-0">
            <div class="overflow-x-auto">
                <table class="table table-sm table-fixed w-full">
                    <thead>
                    <tr>
                        <th class="w-36">회원 UUID</th>
                        <th class="w-auto">내용</th>
                        <th class="w-28">상태</th>
                        <th class="w-28">제출일</th>
                        <th class="w-48">상태 변경</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr th:each="f : ${feedbacks}">
                        <!-- 회원 UUID — 클릭 시 회원 상세 이동 -->
                        <td>
                            <a th:href="@{/admin/members/{uuid}(uuid=${f.memberUuid})}"
                               class="link link-hover font-mono text-xs"
                               th:text="${#strings.substring(f.memberUuid.toString(), 0, 8)}">550e8400</a>
                        </td>
                        <!-- 내용 — 클릭 시 모달 -->
                        <td class="max-w-xs">
                            <span class="cursor-pointer hover:text-primary truncate block"
                                  th:text="${#strings.length(f.content) > 50 ? #strings.substring(f.content, 0, 50) + '...' : f.content}"
                                  th:data-uuid="${f.feedbackUuid}"
                                  th:data-content="${f.content}"
                                  th:data-member="${f.memberUuid}"
                                  th:data-status="${f.status}"
                                  th:data-created="${f.createdAt}"
                                  onclick="openModal(this)">내용</span>
                        </td>
                        <!-- 상태 배지 -->
                        <td>
                            <span class="badge badge-sm"
                                  th:classappend="${f.status == 'PENDING'} ? 'badge-warning' : (${f.status == 'REVIEWED'} ? 'badge-info' : 'badge-success')"
                                  th:text="${f.status}">PENDING</span>
                        </td>
                        <!-- 제출일 -->
                        <td class="text-xs"
                            th:text="${f.createdAt != null ? #temporals.format(f.createdAt, 'yyyy-MM-dd') : '-'}">2026-04-13</td>
                        <!-- 상태 변경 -->
                        <td>
                            <div class="flex gap-1 items-center">
                                <select class="select select-xs select-bordered w-28"
                                        th:data-uuid="${f.feedbackUuid}"
                                        th:id="'select-' + ${f.feedbackUuid}">
                                    <option th:each="s : ${statuses}"
                                            th:value="${s.name()}"
                                            th:text="${s.name()}"
                                            th:selected="${f.status == s.name()}">PENDING</option>
                                </select>
                                <button class="btn btn-xs btn-primary"
                                        th:data-uuid="${f.feedbackUuid}"
                                        onclick="updateStatus(this.dataset.uuid)">변경</button>
                            </div>
                        </td>
                    </tr>

                    <!-- Empty state -->
                    <tr th:if="${feedbacks == null or feedbacks.isEmpty()}">
                        <td colspan="5" class="text-center text-base-content/50 py-12">
                            <i data-lucide="message-circle" class="size-10 mx-auto mb-2 opacity-40"></i>
                            <p>건의사항이 없습니다.</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <!-- 페이지네이션 -->
            <div class="flex justify-center p-4" th:if="${feedbacks != null and feedbacks.totalPages > 1}">
                <div class="join">
                    <a th:href="@{/admin/feedbacks(page=${feedbacks.number - 1})}"
                       class="join-item btn btn-sm"
                       th:classappend="${feedbacks.first} ? 'btn-disabled'">«</a>
                    <button class="join-item btn btn-sm btn-active"
                            th:text="${feedbacks.number + 1} + ' / ' + ${feedbacks.totalPages}">1 / 10</button>
                    <a th:href="@{/admin/feedbacks(page=${feedbacks.number + 1})}"
                       class="join-item btn btn-sm"
                       th:classappend="${feedbacks.last} ? 'btn-disabled'">»</a>
                </div>
            </div>
        </div>
    </div>

    <!-- 내용 확인 모달 -->
    <dialog id="feedbackModal" class="modal">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">건의사항 상세</h3>
            <div class="space-y-2 text-sm">
                <div class="flex gap-2">
                    <span class="text-base-content/60 w-20 shrink-0">회원 UUID</span>
                    <span id="modalMember" class="font-mono break-all"></span>
                </div>
                <div class="flex gap-2">
                    <span class="text-base-content/60 w-20 shrink-0">상태</span>
                    <span id="modalStatus"></span>
                </div>
                <div class="flex gap-2">
                    <span class="text-base-content/60 w-20 shrink-0">제출일</span>
                    <span id="modalCreated"></span>
                </div>
                <div class="flex gap-2 mt-3">
                    <span class="text-base-content/60 w-20 shrink-0">내용</span>
                    <p id="modalContent" class="whitespace-pre-wrap break-all"></p>
                </div>
            </div>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-sm">닫기</button>
                </form>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

</th:block>

<th:block layout:fragment="js">
    <script>
        lucide.createIcons();

        function openModal(el) {
            document.getElementById('modalMember').textContent = el.dataset.member;
            document.getElementById('modalStatus').textContent = el.dataset.status;
            document.getElementById('modalCreated').textContent = el.dataset.created;
            document.getElementById('modalContent').textContent = el.dataset.content;
            document.getElementById('feedbackModal').showModal();
        }

        function updateStatus(uuid) {
            const select = document.getElementById('select-' + uuid);
            const status = select.value;
            fetch('/admin/feedbacks/' + uuid + '/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status })
            }).then(res => {
                if (res.ok) location.reload();
                else alert('상태 변경에 실패했습니다.');
            });
        }
    </script>
</th:block>
</html>
```

---

## Task 9: members/list.html — 눈깔 아이콘 제거 + 행 클릭 이동

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/members/list.html`

- [ ] **Step 1: thead에서 상세 컬럼 제거**

현재:
```html
                        <th class="w-12">상세</th>
```
삭제한다.

- [ ] **Step 2: tbody tr에 클릭 이벤트 추가, 눈깔 td 제거**

현재 `<tr th:each="m : ${members}">` 를 다음으로 교체:

```html
                    <tr th:each="m : ${members}"
                        class="cursor-pointer hover:bg-base-200"
                        th:onclick="|location.href='/admin/members/' + ${m.memberUuid}|">
```

그리고 현재 마지막 `<td>` (눈깔 버튼 td) 전체를 삭제:
```html
                        <td>
                            <a th:href="@{/admin/members/{uuid}(uuid=${m.memberUuid})}"
                               class="btn btn-xs btn-ghost" title="상세">
                                <i data-lucide="eye" class="size-3"></i>
                            </a>
                        </td>
```

- [ ] **Step 3: Empty state colspan 수정**

`colspan="7"` → `colspan="6"` 으로 변경 (컬럼이 1개 줄었으므로):

```html
                        <td colspan="6" class="text-center text-base-content/50 py-12">
```

---

## Self-Review

### 스펙 커버리지

| 요구사항 | Task |
|---------|------|
| 전체 건의사항 목록 조회 (관리자) | Task 2, 5, 6, 8 |
| 상태 변경 API (PENDING/REVIEWED/APPLIED) | Task 1, 4, 5, 6 |
| 건의사항 내용 모달 표시 | Task 8 |
| 회원 UUID 클릭 → 회원 상세 이동 | Task 8 |
| 페이지네이션 | Task 2, 6, 8 |
| 사이드바 건의사항 메뉴 | Task 7 |
| 회원 목록 행 클릭 이동 + 눈깔 제거 | Task 9 |
| FEEDBACK_NOT_FOUND ErrorCode | Task 1 |

### 타입 일관성

- `FeedbackRepository.findAllByOrderByCreatedAtDesc(Pageable)` → `Page<Feedback>` → `Service.getAllFeedbacks()` → `Page<FeedbackAdminResponse>` ✓
- `FeedbackService.updateStatus(UUID, FeedbackStatus)` → Controller에서 `FeedbackStatus.valueOf(request.getStatus())` 호출 ✓
- `FeedbackAdminResponse.from(Feedback)` → `feedbackUuid`, `memberUuid`, `content`, `status(String)`, `createdAt(LocalDateTime)` ✓
- Thymeleaf `${feedbacks}` → `Page<FeedbackAdminResponse>` — `.totalPages`, `.number`, `.first`, `.last`, `.isEmpty()` 모두 Spring `Page` 인터페이스 제공 ✓
- `select-' + ${f.feedbackUuid}` id와 JS `document.getElementById('select-' + uuid)` 일치 ✓
