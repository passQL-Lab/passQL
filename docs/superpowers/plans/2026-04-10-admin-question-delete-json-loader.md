# 관리자 문제 삭제 & 수정 폼 JSON 불러오기 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 페이지에서 문제를 Cascade 삭제하고, 수정 폼에서 JSON 파일/붙여넣기로 필드를 채울 수 있게 한다.

**Architecture:** (1) QuestionService에 deleteQuestionCascade 트랜잭션 메서드 추가 — 8개 자식 테이블을 FK 역순으로 삭제 후 Question 본체 삭제. QuizSession 안전장치 포함. (2) AdminQuestionController에 @DeleteMapping 추가. (3) question-register.html의 인라인 JSON 로직을 공통 JS로 추출하여 question-edit.html과 공유.

**Tech Stack:** Spring Boot, JPA, Thymeleaf, DaisyUI, Vanilla JS

**Spec:** `docs/superpowers/specs/2026-04-10-admin-question-crud-design.md`

---

## 파일 구조

**신규 파일:**
- `server/PQL-Web/src/main/resources/static/js/admin/question-json-loader.js` — JSON 불러오기 공통 JS

**수정 파일:**
- `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` — QUESTION_IN_ACTIVE_SESSION 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuizSessionRepository.java` — findByStatus 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetRepository.java` — deleteByQuestionUuid 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetItemRepository.java` — deleteByChoiceSetUuidIn 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/DailyChallengeRepository.java` — deleteByQuestionUuid 추가
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java` — deleteByQuestionUuid 추가
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/ExecutionLogRepository.java` — deleteByQuestionUuid 추가
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java` — deleteQuestionCascade 추가
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java` — @DeleteMapping 추가
- `server/PQL-Web/src/main/resources/templates/admin/questions.html` — 삭제 버튼 + 확인 모달
- `server/PQL-Web/src/main/resources/templates/admin/question-edit.html` — JSON 불러오기 버튼 + 덮어쓰기 확인 + 공통 JS 로드
- `server/PQL-Web/src/main/resources/templates/admin/question-register.html` — 인라인 JS를 공통 JS 호출로 교체

---

## Task 1: ErrorCode 추가 — QUESTION_IN_ACTIVE_SESSION

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java:81`

- [ ] **Step 1: ErrorCode enum에 항목 추가**

`ErrorCode.java`의 `QUESTION_GENERATE_INPUT_INVALID` 항목 바로 위에 추가:

```java
    // Admin Question Delete
    QUESTION_IN_ACTIVE_SESSION(HttpStatus.CONFLICT, "진행중인 퀴즈 세션에서 사용 중인 문제는 삭제할 수 없습니다."),
```

---

## Task 2: Repository 벌크 삭제 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuizSessionRepository.java`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetRepository.java`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetItemRepository.java`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/DailyChallengeRepository.java`
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java`
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/ExecutionLogRepository.java`

참고: `QuestionChoiceRepository`에는 이미 `deleteByQuestionUuid()` 존재. `QuestionConceptTagRepository`에도 이미 `deleteByQuestionUuid()` 존재.

- [ ] **Step 1: QuizSessionRepository — findByStatus 추가**

`QuizSessionRepository.java` 인터페이스에 메서드 추가:

```java
import com.passql.question.constant.QuizSessionStatus;
import java.util.List;

List<QuizSession> findByStatus(QuizSessionStatus status);
```

- [ ] **Step 2: QuestionChoiceSetRepository — deleteByQuestionUuid 추가**

`QuestionChoiceSetRepository.java` 인터페이스에 추가:

```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Modifying
@Transactional
void deleteByQuestionUuid(UUID questionUuid);
```

- [ ] **Step 3: QuestionChoiceSetItemRepository — deleteByChoiceSetUuidIn 추가**

`QuestionChoiceSetItemRepository.java` 인터페이스에 추가:

```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Modifying
@Transactional
void deleteByChoiceSetUuidIn(List<UUID> choiceSetUuids);
```

- [ ] **Step 4: DailyChallengeRepository — deleteByQuestionUuid 추가**

`DailyChallengeRepository.java` 인터페이스에 추가:

```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Modifying
@Transactional
void deleteByQuestionUuid(UUID questionUuid);
```

- [ ] **Step 5: SubmissionRepository — deleteByQuestionUuid 추가**

`SubmissionRepository.java` 인터페이스에 추가:

```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Modifying
@Transactional
void deleteByQuestionUuid(UUID questionUuid);
```

- [ ] **Step 6: ExecutionLogRepository — deleteByQuestionUuid 추가**

`ExecutionLogRepository.java` 인터페이스에 추가:

```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Modifying
@Transactional
void deleteByQuestionUuid(UUID questionUuid);
```

---

## Task 3: QuestionService — deleteQuestionCascade 메서드 구현

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java`

의존성 주의: `SubmissionRepository`와 `ExecutionLogRepository`는 `PQL-Domain-Submission` 모듈에 위치함. `QuestionService`는 `PQL-Domain-Question` 모듈에 위치. 크로스 모듈 의존성이 필요.

- [ ] **Step 1: build.gradle 의존성 확인**

`server/PQL-Domain-Question/build.gradle`에 `PQL-Domain-Submission`에 대한 의존이 있는지 확인. 없으면 추가:

```groovy
implementation project(':PQL-Domain-Submission')
```

만약 순환 의존이 우려되면, 대안으로 `AdminQuestionController`(PQL-Web에 위치, 양쪽 모듈 모두 접근 가능)에서 삭제 오케스트레이션용 서비스를 둘 수 있음. 하지만 CLAUDE.md에서 Controller에 비즈니스 로직 금지이므로, `PQL-Web`에 `AdminQuestionDeleteService`를 두거나 모듈 의존성을 추가해야 함. **구현 시 실제 build.gradle을 확인하여 결정.**

- [ ] **Step 2: QuestionService에 새 의존성 필드 추가**

`QuestionService.java` 클래스 상단 필드 영역(라인 39-45 부근)에 추가:

```java
import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.repository.QuestionConceptTagRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.repository.ExecutionLogRepository;
```

필드 추가 (기존 final 필드 아래에):

```java
private final QuestionConceptTagRepository conceptTagRepository;
private final QuizSessionRepository quizSessionRepository;
private final SubmissionRepository submissionRepository;
private final ExecutionLogRepository executionLogRepository;
```

주의: `QuestionConceptTagRepository`는 기존 `QuestionService`에 주입되어 있지 않을 수 있음. 구현 시 확인.

- [ ] **Step 3: deleteQuestionCascade 메서드 구현**

`QuestionService.java`의 `updateQuestion()` 메서드(라인 178) 아래에 추가:

```java
@Transactional
public void deleteQuestionCascade(UUID questionUuid) {
    // 0. Question 존재 확인
    Question question = questionRepository.findById(questionUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

    // 1. 안전장치: 진행중인 QuizSession에서 해당 문제 사용 중인지 검사
    List<com.passql.question.entity.QuizSession> activeSessions =
            quizSessionRepository.findByStatus(QuizSessionStatus.IN_PROGRESS);
    for (var session : activeSessions) {
        if (session.getQuestionOrderJson() != null
                && session.getQuestionOrderJson().contains(questionUuid.toString())) {
            throw new CustomException(ErrorCode.QUESTION_IN_ACTIVE_SESSION);
        }
    }

    // 2. ExecutionLog 삭제
    executionLogRepository.deleteByQuestionUuid(questionUuid);

    // 3. Submission 삭제
    submissionRepository.deleteByQuestionUuid(questionUuid);

    // 4. DailyChallenge 삭제
    dailyChallengeRepository.deleteByQuestionUuid(questionUuid);

    // 5. QuestionConceptTag 삭제
    conceptTagRepository.deleteByQuestionUuid(questionUuid);

    // 6. QuestionChoiceSetItem 삭제 (ChoiceSet UUID 목록 통해 간접 삭제)
    List<QuestionChoiceSet> choiceSets = choiceSetRepository.findByQuestionUuidOrderByCreatedAtDesc(questionUuid);
    if (!choiceSets.isEmpty()) {
        List<UUID> choiceSetUuids = choiceSets.stream()
                .map(QuestionChoiceSet::getChoiceSetUuid)
                .toList();
        choiceSetItemRepository.deleteByChoiceSetUuidIn(choiceSetUuids);
    }

    // 7. QuestionChoiceSet 삭제
    choiceSetRepository.deleteByQuestionUuid(questionUuid);

    // 8. QuestionChoice 삭제
    questionChoiceRepository.deleteByQuestionUuid(questionUuid);

    // 9. Question 본체 삭제
    questionRepository.delete(question);
}
```

---

## Task 4: AdminQuestionController — @DeleteMapping 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java`

- [ ] **Step 1: import 추가**

`AdminQuestionController.java` 상단 import에 추가:

```java
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
```

- [ ] **Step 2: @DeleteMapping 메서드 추가**

`update()` 메서드(라인 134) 아래에 추가:

```java
@DeleteMapping("/{uuid}")
public String delete(@PathVariable UUID uuid, RedirectAttributes redirectAttributes) {
    try {
        questionService.deleteQuestionCascade(uuid);
        redirectAttributes.addFlashAttribute("successMessage", "문제가 삭제되었습니다.");
    } catch (CustomException e) {
        redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
    }
    return "redirect:/admin/questions";
}
```

---

## Task 5: questions.html — 삭제 버튼 + 확인 모달 + Flash 메시지

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/questions.html`

- [ ] **Step 1: Flash 메시지 표시 영역 추가**

`questions.html`에서 테이블 상단 (필터 영역 아래, 테이블 시작 전)에 flash 메시지 표시 블록 추가. 정확한 위치는 파일 구조를 읽고 판단. 다음 HTML을 삽입:

```html
<!-- Flash messages -->
<div th:if="${successMessage}" class="alert alert-success mb-4">
    <i data-lucide="check-circle" class="size-5"></i>
    <span th:text="${successMessage}"></span>
</div>
<div th:if="${errorMessage}" class="alert alert-error mb-4">
    <i data-lucide="alert-circle" class="size-5"></i>
    <span th:text="${errorMessage}"></span>
</div>
```

- [ ] **Step 2: 삭제 버튼 추가**

`questions.html` 라인 109-112 (편집 아이콘 `</a>` 이후, `</div>` 이전)에 삭제 폼 추가:

기존:
```html
                                <a th:href="@{/admin/questions/{uuid}/edit(uuid=${q.questionUuid})}"
                                   class="btn btn-xs btn-ghost" title="편집">
                                    <i data-lucide="pencil" class="size-3"></i>
                                </a>
```

이후에 삭제 버튼 추가:
```html
                                <button type="button" class="btn btn-xs btn-ghost text-error"
                                        title="삭제"
                                        th:data-uuid="${q.questionUuid}"
                                        th:data-title="${q.stemPreview}"
                                        onclick="openDeleteModal(this)">
                                    <i data-lucide="trash-2" class="size-3"></i>
                                </button>
```

- [ ] **Step 3: 삭제 확인 모달 추가**

`questions.html` 파일 하단, `</th:block>` (content fragment 닫기) 직전에 모달 추가:

```html
<!-- 삭제 확인 모달 -->
<dialog id="deleteModal" class="modal">
    <div class="modal-box">
        <h3 class="font-bold text-lg text-error">문제를 삭제하시겠습니까?</h3>
        <p class="py-4">
            "<span id="deleteTargetTitle" class="font-medium"></span>" 을(를) 삭제합니다.
        </p>
        <p class="text-sm text-base-content/60">
            이 작업은 되돌릴 수 없으며, 해당 문제의 제출 기록·실행 로그·선택지·태그·오늘의 문제 등록 이력이 모두 함께 삭제됩니다.
            진행중인 퀴즈 세션에서 사용 중이면 삭제되지 않습니다.
        </p>
        <div class="modal-action">
            <button class="btn" onclick="document.getElementById('deleteModal').close()">취소</button>
            <form id="deleteForm" method="post">
                <input type="hidden" name="_method" value="delete"/>
                <button type="submit" class="btn btn-error">삭제</button>
            </form>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

- [ ] **Step 4: 삭제 JS 함수 추가**

`questions.html`의 JS 블록 (`layout:fragment="js"`)에 스크립트 추가:

```html
<th:block layout:fragment="js">
<script>
    lucide.createIcons();

    function openDeleteModal(btn) {
        const uuid = btn.dataset.uuid;
        const title = btn.dataset.title || '(제목 없음)';
        document.getElementById('deleteTargetTitle').textContent = title;
        const form = document.getElementById('deleteForm');
        form.action = '/admin/questions/' + uuid;
        document.getElementById('deleteModal').showModal();
    }
</script>
</th:block>
```

---

## Task 6: JSON 불러오기 공통 JS 추출

**Files:**
- Create: `server/PQL-Web/src/main/resources/static/js/admin/question-json-loader.js`
- Modify: `server/PQL-Web/src/main/resources/templates/admin/question-register.html`

- [ ] **Step 1: 공통 JS 파일 생성**

`question-json-loader.js` 신규 파일 생성:

```javascript
/**
 * 문제 등록/수정 폼의 JSON 불러오기 공통 로직.
 * question-register.html, question-edit.html 에서 공유.
 *
 * 사용법:
 *   initQuestionJsonLoader({ confirmOverwrite: false }); // 등록 폼
 *   initQuestionJsonLoader({ confirmOverwrite: true });   // 수정 폼 (덮어쓰기 확인)
 */

let _jsonLoaderConfig = { confirmOverwrite: false };

function initQuestionJsonLoader(config) {
    _jsonLoaderConfig = { ..._jsonLoaderConfig, ...config };
}

function applyJson(data) {
    // topicCode → select option 매핑 (등록 폼: id='topicSelect', 수정 폼: name='topicUuid')
    if (data.topicCode) {
        const sel = document.getElementById('topicSelect') || document.querySelector('select[name="topicUuid"]');
        if (sel) {
            for (const opt of sel.options) {
                if (opt.dataset.code === data.topicCode) {
                    sel.value = opt.value;
                    break;
                }
            }
        }
    }

    // 난이도
    if (data.difficulty != null) {
        const rangeEl = document.querySelector('input[name="difficulty"]');
        if (rangeEl) {
            rangeEl.value = data.difficulty;
            const label = document.getElementById('difficultyLabel');
            if (label) label.textContent = 'Lv.' + data.difficulty;
        }
    }

    // 실행 모드
    if (data.executionMode) {
        const radio = document.querySelector('input[name="executionMode"][value="' + data.executionMode + '"]');
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
    }

    // 텍스트 필드
    const textMap = {
        stem: 'textarea[name="stem"]',
        hint: 'input[name="hint"]',
        schemaDdl: 'textarea[name="schemaDdl"], #schemaDdl',
        schemaSampleData: 'textarea[name="schemaSampleData"], #schemaSampleData',
        schemaDisplay: 'textarea[name="schemaDisplay"]',
        schemaIntent: 'input[name="schemaIntent"]',
        answerSql: 'textarea[name="answerSql"], #answerSql'
    };
    for (const [key, selector] of Object.entries(textMap)) {
        if (data[key] != null) {
            const el = document.querySelector(selector);
            if (el) el.value = data[key];
        }
    }
}

function _doApplyJson(data) {
    if (_jsonLoaderConfig.confirmOverwrite) {
        if (!confirm('현재 입력된 내용을 JSON 데이터로 덮어쓰시겠습니까?')) return;
    }
    applyJson(data);
}

function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            _doApplyJson(data);
        } catch (err) {
            alert('JSON 파싱 오류: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function openJsonPasteModal() {
    document.getElementById('jsonPasteArea').value = '';
    document.getElementById('jsonPasteError').classList.add('hidden');
    document.getElementById('jsonPasteModal').showModal();
}

function applyJsonFromPaste() {
    const raw = document.getElementById('jsonPasteArea').value.trim();
    const errEl = document.getElementById('jsonPasteError');
    try {
        const data = JSON.parse(raw);
        _doApplyJson(data);
        document.getElementById('jsonPasteModal').close();
    } catch (err) {
        errEl.textContent = 'JSON 파싱 오류: ' + err.message;
        errEl.classList.remove('hidden');
    }
}
```

- [ ] **Step 2: question-register.html에서 인라인 JS를 공통 JS 호출로 교체**

`question-register.html`의 `<th:block layout:fragment="js">` (라인 287-480) 내에서:

**제거:** `applyJson()`, `loadJsonFile()`, `openJsonPasteModal()`, `applyJsonFromPaste()` 함수 4개 (라인 352-432)

**추가:** `<script>` 태그 시작 직전에 공통 JS 로드:

```html
<th:block layout:fragment="js">
<script th:src="@{/js/admin/question-json-loader.js}"></script>
<script>
    lucide.createIcons();
    initQuestionJsonLoader({ confirmOverwrite: false });

    // 실행 모드 전환 시 스키마 섹션 표시/숨김
    document.querySelectorAll('input[name="executionMode"]').forEach(radio => {
    // ... (기존 코드 유지)
    });

    // ── 가이드 모달 ─── (기존 코드 유지)
    // ...

    // ── Sandbox 실행 테스트 ─── (기존 코드 유지)
    // ...
</script>
</th:block>
```

**주의:** `topicSelect` — 등록 폼의 select 태그에 `id="topicSelect"` 가 있는지 확인. 있으면 공통 JS가 그대로 동작. 없으면 등록 폼의 select에 `id="topicSelect"` 추가하거나 공통 JS의 fallback selector (`select[name="topicUuid"]`)로 처리됨. 등록 폼의 select `name`이 `topicUuid`인지 구현 시 확인.

---

## Task 7: question-edit.html — JSON 불러오기 기능 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/question-edit.html`

- [ ] **Step 1: 헤더에 JSON 불러오기 버튼 추가**

`question-edit.html` 라인 10-16 (헤더 영역)을 수정. 기존:

```html
    <div class="mb-4 flex items-center gap-2">
        <a th:href="@{/admin/questions/{uuid}(uuid=${question.questionUuid})}" class="btn btn-sm btn-ghost">
            <i data-lucide="arrow-left" class="size-4"></i>
            상세로
        </a>
        <h2 class="text-lg font-bold">문제 편집</h2>
    </div>
```

변경:

```html
    <div class="mb-4 flex items-center gap-2 flex-wrap">
        <a th:href="@{/admin/questions/{uuid}(uuid=${question.questionUuid})}" class="btn btn-sm btn-ghost">
            <i data-lucide="arrow-left" class="size-4"></i>
            상세로
        </a>
        <h2 class="text-lg font-bold">문제 편집</h2>
        <div class="ml-auto flex gap-2">
            <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('jsonFileInput').click()">
                <i data-lucide="upload" class="size-4"></i>
                JSON 파일 불러오기
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="openJsonPasteModal()">
                <i data-lucide="clipboard-paste" class="size-4"></i>
                JSON 붙여넣기
            </button>
            <input type="file" id="jsonFileInput" accept=".json" class="hidden" onchange="loadJsonFile(event)"/>
        </div>
    </div>
```

- [ ] **Step 2: JSON 붙여넣기 모달 추가**

`question-edit.html`의 `</form>` (라인 143) 뒤, `</th:block>` (content fragment 끝) 전에 추가:

```html
    <!-- JSON 붙여넣기 모달 -->
    <dialog id="jsonPasteModal" class="modal">
        <div class="modal-box w-11/12 max-w-2xl">
            <h3 class="font-bold text-lg mb-4">JSON 붙여넣기</h3>
            <textarea id="jsonPasteArea" rows="12"
                      class="textarea textarea-bordered w-full font-mono text-sm"
                      placeholder='{"topicCode":"sql_basic_select","difficulty":3,...}'></textarea>
            <p id="jsonPasteError" class="text-error text-sm mt-2 hidden"></p>
            <div class="modal-action">
                <button class="btn" onclick="document.getElementById('jsonPasteModal').close()">취소</button>
                <button class="btn btn-primary" onclick="applyJsonFromPaste()">적용</button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
```

- [ ] **Step 3: 수정 폼 토픽 select에 data-code 속성 추가**

`question-edit.html` 라인 34-37 (토픽 select option)에 `th:data-code` 추가:

기존:
```html
                            <option th:each="t : ${topics}"
                                    th:value="${t.topicUuid}"
                                    th:text="${t.displayName}"
                                    th:selected="${question.topicUuid != null and question.topicUuid == t.topicUuid}">-</option>
```

변경:
```html
                            <option th:each="t : ${topics}"
                                    th:value="${t.topicUuid}"
                                    th:text="${t.displayName}"
                                    th:data-code="${t.code}"
                                    th:selected="${question.topicUuid != null and question.topicUuid == t.topicUuid}">-</option>
```

- [ ] **Step 4: JS 블록 교체 — 공통 JS 로드 + 초기화**

`question-edit.html` 라인 147-149 (기존 JS 블록)을 교체:

기존:
```html
<th:block layout:fragment="js">
    <script>lucide.createIcons();</script>
</th:block>
```

변경:
```html
<th:block layout:fragment="js">
<script th:src="@{/js/admin/question-json-loader.js}"></script>
<script>
    lucide.createIcons();
    initQuestionJsonLoader({ confirmOverwrite: true });

    // 실행 모드 전환 시 스키마 섹션 표시/숨김
    document.querySelectorAll('input[name="executionMode"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const schemaSection = document.getElementById('schemaSection');
            if (!schemaSection) return;
            if (this.value === 'EXECUTABLE') {
                schemaSection.classList.remove('hidden');
            } else {
                schemaSection.classList.add('hidden');
            }
        });
    });
</script>
</th:block>
```

---

## Task 8: 수동 검증

- [ ] **Step 1: 서버 기동 후 문제 목록 페이지 확인**

1. 관리자 문제 목록 (`/admin/questions`) 에 삭제 버튼(🗑️)이 각 행에 노출되는지 확인
2. 삭제 클릭 → 모달 팝업 확인
3. 모달에서 "삭제" 클릭 → 문제 삭제 및 목록 redirect + flash 성공 메시지

- [ ] **Step 2: 진행중 세션 안전장치 확인**

1. 퀴즈 세션을 시작하여 IN_PROGRESS 상태 세션 생성
2. 해당 세션에 포함된 문제를 삭제 시도 → "진행중인 퀴즈 세션에서 사용 중" 에러 메시지 확인

- [ ] **Step 3: 수정 폼 JSON 불러오기 확인**

1. `/admin/questions/{uuid}/edit` 에서 JSON 파일 불러오기 버튼 확인
2. JSON 파일 또는 붙여넣기로 필드 덮어쓰기 확인
3. "현재 입력을 덮어쓰시겠습니까?" 확인 모달 동작 확인

- [ ] **Step 4: 등록 폼 기능 회귀 확인**

1. `/admin/questions/register` 에서 기존 JSON 파일 불러오기/붙여넣기가 정상 동작하는지 확인
2. 가이드 모달/Sandbox 테스트 기능 정상 동작 확인
