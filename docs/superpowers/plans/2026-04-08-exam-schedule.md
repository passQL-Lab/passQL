# Exam Schedule API 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SQLD/SQLP 시험 일정 관리 API(사용자+어드민) 및 어드민 Thymeleaf 화면 구현

**Architecture:** 기존 MetaService/MetaController에 있는 exam-schedule 로직을 전용 ExamScheduleService로 분리하고, 사용자 API는 ExamScheduleController로, 어드민 API+화면은 AdminExamScheduleController로 분리한다. DTO 변환을 적용하여 Entity 직접 노출을 제거한다.

**Tech Stack:** Spring Boot 3.4.4, JPA, Thymeleaf + DaisyUI 5 + Tailwind CSS 4 + Lucide Icons, Flyway (시드는 V0_0_22에 이미 존재)

**Spec:** `docs/superpowers/specs/2026-04-08-exam-schedule-design.md`

**주의 - git commit 금지:** 각 Task 완료 후 커밋하지 않는다. 코드 변경만 수행한다.

---

## 기존 코드 현황 (중요)

구현 전 반드시 인지해야 할 사항:

- `MetaController`에 이미 GET /api/exam-schedules, GET /api/exam-schedules/selected, PUT /api/exam-schedules/{uuid}/select 존재
- `MetaService`에 getAllExamSchedules(), getSelectedExamSchedule(), selectExamSchedule() 존재
- Entity를 직접 반환하고 있으므로 DTO 변환 적용 필요
- certType 필터링, POST(추가), DELETE(삭제) 미구현

## 파일 구조

| 파일 | 작업 | 역할 |
|------|------|------|
| `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/ExamScheduleResponse.java` | **신규** | 응답 DTO |
| `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/ExamScheduleCreateRequest.java` | **신규** | 생성 요청 DTO |
| `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/ExamScheduleRepository.java` | **수정** | existsBy 쿼리 추가 |
| `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/ExamScheduleService.java` | **신규** | 시험일정 비즈니스 로직 |
| `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/MetaService.java` | **수정** | exam-schedule 관련 메서드 제거 |
| `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` | **수정** | EXAM_SCHEDULE_DUPLICATE 추가 |
| `server/PQL-Web/src/main/java/com/passql/web/controller/ExamScheduleController.java` | **신규** | 사용자 API |
| `server/PQL-Web/src/main/java/com/passql/web/controller/MetaController.java` | **수정** | exam-schedule 엔드포인트 제거 |
| `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminExamScheduleController.java` | **신규** | 어드민 API + 화면 |
| `server/PQL-Web/src/main/resources/templates/admin/exam-schedules.html` | **신규** | 어드민 Thymeleaf 화면 |
| `server/PQL-Web/src/main/resources/templates/admin/layout.html` | **수정** | 사이드바 메뉴 추가 |

---

### Task 1: DTO 생성

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/ExamScheduleResponse.java`
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/dto/ExamScheduleCreateRequest.java`

- [ ] **Step 1: ExamScheduleResponse DTO 생성**

```java
package com.passql.meta.dto;

import com.passql.meta.entity.ExamSchedule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ExamScheduleResponse {

    private UUID examScheduleUuid;
    private String certType;
    private Integer round;
    private LocalDate examDate;
    private Boolean isSelected;

    public static ExamScheduleResponse from(ExamSchedule e) {
        return new ExamScheduleResponse(
            e.getExamScheduleUuid(),
            e.getCertType().name(),
            e.getRound(),
            e.getExamDate(),
            e.getIsSelected()
        );
    }
}
```

- [ ] **Step 2: ExamScheduleCreateRequest DTO 생성**

```java
package com.passql.meta.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ExamScheduleCreateRequest {

    private String certType;
    private Integer round;
    private LocalDate examDate;
}
```

---

### Task 2: ErrorCode 추가 + Repository 보완

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/ExamScheduleRepository.java`

- [ ] **Step 1: ErrorCode에 EXAM_SCHEDULE_DUPLICATE 추가**

`ErrorCode.java`의 `EXAM_SCHEDULE_NOT_FOUND` 아래에 추가:

```java
EXAM_SCHEDULE_DUPLICATE(HttpStatus.CONFLICT, "이미 등록된 시험 회차입니다."),
```

- [ ] **Step 2: ExamScheduleRepository에 existsBy 쿼리 추가**

`ExamScheduleRepository.java`에 메서드 추가:

```java
boolean existsByCertTypeAndRound(CertType certType, Integer round);
```

---

### Task 3: ExamScheduleService 생성

**Files:**
- Create: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/ExamScheduleService.java`

- [ ] **Step 1: ExamScheduleService 작성**

```java
package com.passql.meta.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleCreateRequest;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.repository.ExamScheduleRepository;
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
public class ExamScheduleService {

    private final ExamScheduleRepository examScheduleRepository;

    public List<ExamScheduleResponse> getSchedulesByCertType(CertType certType) {
        return examScheduleRepository.findByCertTypeOrderByRoundAsc(certType).stream()
                .map(ExamScheduleResponse::from)
                .toList();
    }

    public ExamScheduleResponse getSelectedSchedule() {
        return examScheduleRepository.findFirstByIsSelectedTrue()
                .map(ExamScheduleResponse::from)
                .orElse(null);
    }

    public List<ExamScheduleResponse> getAllSchedules(CertType certType) {
        if (certType == null) {
            return examScheduleRepository.findAllByOrderByCertTypeAscRoundAsc().stream()
                    .map(ExamScheduleResponse::from)
                    .toList();
        }
        return getSchedulesByCertType(certType);
    }

    @Transactional
    public ExamScheduleResponse createSchedule(ExamScheduleCreateRequest request) {
        CertType certType = CertType.valueOf(request.getCertType());

        if (examScheduleRepository.existsByCertTypeAndRound(certType, request.getRound())) {
            throw new CustomException(ErrorCode.EXAM_SCHEDULE_DUPLICATE);
        }

        ExamSchedule schedule = ExamSchedule.builder()
                .certType(certType)
                .round(request.getRound())
                .examDate(request.getExamDate())
                .isSelected(false)
                .build();

        ExamSchedule saved = examScheduleRepository.save(schedule);
        return ExamScheduleResponse.from(saved);
    }

    @Transactional
    public void selectSchedule(UUID examScheduleUuid) {
        ExamSchedule target = examScheduleRepository.findById(examScheduleUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));

        examScheduleRepository.findFirstByIsSelectedTrue()
                .ifPresent(current -> current.setIsSelected(false));

        target.setIsSelected(true);
    }

    @Transactional
    public void deleteSchedule(UUID examScheduleUuid) {
        ExamSchedule schedule = examScheduleRepository.findById(examScheduleUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.EXAM_SCHEDULE_NOT_FOUND));

        examScheduleRepository.delete(schedule);
    }
}
```

---

### Task 4: MetaController/MetaService에서 exam-schedule 로직 제거

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/MetaController.java`
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/MetaService.java`

- [ ] **Step 1: MetaController에서 exam-schedule 엔드포인트 3개 제거**

`MetaController.java`에서 다음을 제거:
- `getExamSchedules()` 메서드 (GET /exam-schedules)
- `getSelectedExamSchedule()` 메서드 (GET /exam-schedules/selected)
- `selectExamSchedule()` 메서드 (PUT /exam-schedules/{uuid}/select)
- 관련 import: `ExamSchedule`, `CustomException`, `ErrorCode`, `UUID`, `PutMapping`, `PathVariable`

제거 후 `MetaController.java` 전체:

```java
package com.passql.web.controller;

import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MetaController implements MetaControllerDocs {

    private final MetaService metaService;

    @GetMapping("/meta/topics")
    public ResponseEntity<List<TopicTree>> getTopics() {
        return ResponseEntity.ok(metaService.getTopicTree());
    }

    @GetMapping("/meta/tags")
    public ResponseEntity<List<ConceptTag>> getTags() {
        return ResponseEntity.ok(metaService.getActiveTags());
    }
}
```

- [ ] **Step 2: MetaService에서 exam-schedule 관련 메서드 3개 + import 제거**

`MetaService.java`에서 다음을 제거:
- `getAllExamSchedules()` 메서드
- `getSelectedExamSchedule()` 메서드
- `selectExamSchedule()` 메서드
- `examScheduleRepository` 필드
- 관련 import: `ExamSchedule`, `ExamScheduleRepository`, `Optional`, `UUID`, `CustomException`, `ErrorCode`

제거 후 `MetaService.java` 전체:

```java
package com.passql.meta.service;

import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import com.passql.meta.repository.ConceptTagRepository;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetaService {
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final ConceptTagRepository conceptTagRepository;

    public List<TopicTree> getTopicTree() {
        List<com.passql.meta.entity.Topic> topics = topicRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return topics.stream()
                .map(topic -> {
                    List<TopicTree.SubtopicItem> subs = subtopicRepository
                            .findByTopicUuidOrderBySortOrderAsc(topic.getTopicUuid())
                            .stream()
                            .map(s -> new TopicTree.SubtopicItem(s.getCode(), s.getDisplayName()))
                            .toList();
                    return new TopicTree(topic.getCode(), topic.getDisplayName(), subs);
                })
                .toList();
    }

    public List<ConceptTag> getActiveTags() {
        return conceptTagRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }
}
```

---

### Task 5: 사용자 API Controller 생성

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/ExamScheduleController.java`

- [ ] **Step 1: ExamScheduleController 작성**

```java
package com.passql.web.controller;

import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exam-schedules")
@RequiredArgsConstructor
public class ExamScheduleController {

    private final ExamScheduleService examScheduleService;

    @GetMapping
    public ResponseEntity<List<ExamScheduleResponse>> getSchedules(
            @RequestParam(value = "certType", required = false) String certType) {
        CertType type = (certType != null) ? CertType.valueOf(certType) : null;
        return ResponseEntity.ok(examScheduleService.getAllSchedules(type));
    }

    @GetMapping("/selected")
    public ResponseEntity<ExamScheduleResponse> getSelected() {
        return ResponseEntity.ok(examScheduleService.getSelectedSchedule());
    }
}
```

---

### Task 6: 어드민 Controller 생성

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminExamScheduleController.java`

- [ ] **Step 1: AdminExamScheduleController 작성**

```java
package com.passql.web.controller.admin;

import com.passql.meta.constant.CertType;
import com.passql.meta.dto.ExamScheduleCreateRequest;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.service.ExamScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/admin/exam-schedules")
@RequiredArgsConstructor
public class AdminExamScheduleController {

    private final ExamScheduleService examScheduleService;

    @GetMapping
    public String list(@RequestParam(value = "certType", required = false) String certType, Model model) {
        CertType type = (certType != null && !certType.isEmpty()) ? CertType.valueOf(certType) : null;
        List<ExamScheduleResponse> schedules = examScheduleService.getAllSchedules(type);

        model.addAttribute("schedules", schedules);
        model.addAttribute("certTypes", CertType.values());
        model.addAttribute("selectedCertType", certType);
        model.addAttribute("pageTitle", "시험 일정 관리");
        model.addAttribute("currentMenu", "exam-schedules");
        return "admin/exam-schedules";
    }

    @PostMapping
    public String create(ExamScheduleCreateRequest request) {
        examScheduleService.createSchedule(request);
        return "redirect:/admin/exam-schedules";
    }

    @PutMapping("/{uuid}/select")
    @ResponseBody
    public ResponseEntity<Void> select(@PathVariable("uuid") UUID uuid) {
        examScheduleService.selectSchedule(uuid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{uuid}")
    @ResponseBody
    public ResponseEntity<Void> delete(@PathVariable("uuid") UUID uuid) {
        examScheduleService.deleteSchedule(uuid);
        return ResponseEntity.ok().build();
    }
}
```

---

### Task 7: Thymeleaf 어드민 화면 생성

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/exam-schedules.html`

- [ ] **Step 1: exam-schedules.html 작성**

기존 `topics.html` 패턴을 따른다. layout.html 상속, DaisyUI 5, Tailwind CSS 4, Lucide Icons 사용.

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{admin/layout}">

<th:block layout:fragment="title">시험 일정 관리</th:block>

<th:block layout:fragment="content">

    <!-- 회차 추가 폼 -->
    <div class="card bg-base-100 shadow mb-4">
        <div class="card-body p-4">
            <h3 class="card-title text-base mb-3">
                <i data-lucide="plus-circle" class="size-5"></i>
                회차 추가
            </h3>
            <form th:action="@{/admin/exam-schedules}" method="post" class="flex flex-wrap items-end gap-3">
                <div class="form-control">
                    <label class="label"><span class="label-text">자격증</span></label>
                    <select name="certType" class="select select-bordered select-sm" required>
                        <option th:each="ct : ${certTypes}" th:value="${ct.name()}" th:text="${ct.name()}">SQLD</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label"><span class="label-text">회차</span></label>
                    <input type="number" name="round" class="input input-bordered input-sm w-24" min="1" required/>
                </div>
                <div class="form-control">
                    <label class="label"><span class="label-text">시험일</span></label>
                    <input type="date" name="examDate" class="input input-bordered input-sm" required/>
                </div>
                <button type="submit" class="btn btn-sm btn-primary">
                    <i data-lucide="plus" class="size-4"></i>
                    추가
                </button>
            </form>
        </div>
    </div>

    <!-- 필터 + 목록 -->
    <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
                <h3 class="card-title text-base">
                    <i data-lucide="calendar-days" class="size-5"></i>
                    시험 일정 목록
                </h3>
                <form th:action="@{/admin/exam-schedules}" method="get" class="flex items-center gap-2">
                    <select name="certType" class="select select-bordered select-sm"
                            onchange="this.form.submit()">
                        <option value="">전체</option>
                        <option th:each="ct : ${certTypes}" th:value="${ct.name()}" th:text="${ct.name()}"
                                th:selected="${selectedCertType == ct.name()}">SQLD</option>
                    </select>
                </form>
            </div>

            <div class="overflow-x-auto">
                <table class="table table-sm">
                    <thead>
                    <tr>
                        <th>자격증</th>
                        <th>회차</th>
                        <th>시험일</th>
                        <th class="w-20">선택</th>
                        <th class="w-20">액션</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr th:each="s : ${schedules}"
                        th:classappend="${s.isSelected} ? 'bg-primary/10'">
                        <td>
                            <span class="badge badge-sm"
                                  th:classappend="${s.certType == 'SQLD'} ? 'badge-info' : 'badge-warning'"
                                  th:text="${s.certType}">SQLD</span>
                        </td>
                        <td th:text="'제' + ${s.round} + '회'">제61회</td>
                        <td th:text="${s.examDate}">2026-05-31</td>
                        <td>
                            <input type="radio" name="selected" class="radio radio-primary radio-sm"
                                   th:checked="${s.isSelected}"
                                   th:onclick="|selectSchedule('${s.examScheduleUuid}')|"/>
                        </td>
                        <td>
                            <button class="btn btn-xs btn-ghost text-error"
                                    th:onclick="|deleteSchedule('${s.examScheduleUuid}')|">
                                <i data-lucide="trash-2" class="size-4"></i>
                            </button>
                        </td>
                    </tr>

                    <tr th:if="${schedules == null or schedules.isEmpty()}">
                        <td colspan="5" class="text-center text-base-content/40 py-8">
                            <i data-lucide="calendar-x" class="size-8 mx-auto mb-2 opacity-30"></i>
                            <p class="text-sm">등록된 시험 일정이 없습니다.</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</th:block>

<th:block layout:fragment="js">
    <script>
        lucide.createIcons();

        function selectSchedule(uuid) {
            fetch('/admin/exam-schedules/' + uuid + '/select', { method: 'PUT' })
                .then(res => {
                    if (res.ok) location.reload();
                    else alert('선택 변경에 실패했습니다.');
                });
        }

        function deleteSchedule(uuid) {
            if (!confirm('정말 삭제하시겠습니까?')) return;
            fetch('/admin/exam-schedules/' + uuid, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) location.reload();
                    else alert('삭제에 실패했습니다.');
                });
        }
    </script>
</th:block>
</html>
```

---

### Task 8: 사이드바 메뉴 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/layout.html`

- [ ] **Step 1: layout.html 사이드바에 "시험 일정" 메뉴 항목 추가**

`layout.html`의 `<ul class="menu p-4 gap-1" id="sidebarMenu">` 내부, "앱 설정" `<li>` 앞에 추가:

```html
<li>
    <a th:href="@{/admin/exam-schedules}" th:classappend="${currentMenu == 'exam-schedules'} ? 'active'">
        <i data-lucide="calendar-days" class="size-5"></i>
        시험 일정
    </a>
</li>
```

---

### Task 9: version.yml 업데이트

**Files:**
- Modify: `version.yml`

- [ ] **Step 1: version.yml의 version을 0.0.23, version_code를 23으로 업데이트**

```yaml
version: "0.0.23"
version_code: 23
```

`metadata.last_updated`와 `metadata.last_updated_by`도 업데이트:

```yaml
metadata:
  last_updated: "2026-04-08 00:00:00"
  last_updated_by: "Cassiiopeia"
```
