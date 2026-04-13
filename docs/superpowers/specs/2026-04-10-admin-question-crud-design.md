# 관리자 문제 관리 — 수정 폼 JSON 불러오기 & 문제 삭제 기능 설계

- **작성일**: 2026-04-10
- **관련 이슈**: #49 후속 (문제 직접 등록 폼 JSON 불러오기 기능의 수정 폼 확장 + 삭제 기능 신규)
- **대상 영역**: Spring Boot 관리자 페이지 (Thymeleaf)

## 배경 및 목적

커밋 81be22e 에서 관리자 문제 **등록** 폼(`question-register.html`)에 JSON 파일 불러오기 및 붙여넣기 기능이 추가되었다. 그러나 다음 두 가지 요구사항이 남아 있다:

1. **문제 수정** 폼(`question-edit.html`)에도 동일한 JSON 불러오기 기능 필요
2. 관리자 **문제 목록**(`questions.html`)에서 문제를 **삭제**할 수 있어야 함 (현재 상세/편집 아이콘만 존재)

## 현재 상태

- 관리자 페이지는 Thymeleaf 템플릿 기반 (`server/PQL-Web/src/main/resources/templates/admin/`)
- `AdminQuestionController` 에는 조회/등록/수정만 존재, **DELETE 엔드포인트 없음**
- `QuestionService` / `QuestionRepository` 에 삭제 메서드 없음
- Question 엔티티를 FK 로 참조하는 자식 테이블 8개 존재:
  - `QuestionChoice`, `QuestionChoiceSet`, `QuestionChoiceSetItem`, `QuestionConceptTag`,
    `DailyChallenge`, `Submission`, `ExecutionLog`, `QuizSession.questionOrderJson` (JSON 배열)
- 자식들에 **Cascade 설정 전혀 없음** → 단순 DELETE 는 FK 제약 위반
- 프로젝트는 이미 `@DeleteMapping` 과 `th:method="delete"` 패턴을 사용 중
  (`AdminDailyChallengeController`, `AdminExamScheduleController`, `prompts.html`, `question-form.html`)

## 설계

### 1. 백엔드: Cascade 삭제 API

**엔드포인트:** `DELETE /admin/questions/{uuid}` (프로젝트 기존 패턴 준수)

**컨트롤러:** `AdminQuestionController`
- 성공 시 302 redirect → `/admin/questions` + flash 성공 메시지
- Question 없음 → 404
- 진행중 퀴즈 세션 충돌 → 409 + flash 에러 메시지
- 그 외 예외 → 롤백 + flash 에러 메시지

**서비스:** `QuestionService.deleteQuestionCascade(UUID questionUuid)` — `@Transactional`

**삭제 순서 (FK 의존성 역순):**

1. **🛡️ 안전장치**: `QuizSession` 중 `status = 진행중` 세션 조회 후,
   `questionOrderJson` 을 앱 레벨에서 파싱하여 해당 UUID 포함 여부 검사.
   포함된 세션이 있으면 `IllegalStateException` 발생 → 컨트롤러에서 409 응답.
   - DB 별 JSON 함수 의존을 피하기 위한 앱 레벨 파싱 전략 채택
   - 진행중 세션 수가 적다는 전제
2. `ExecutionLog` where `questionUuid`
3. `Submission` where `questionUuid`
4. `DailyChallenge` where `questionUuid`
5. `QuestionConceptTag` where `questionUuid`
6. `QuestionChoiceSetItem` where `choiceSetUuid in (해당 Question의 ChoiceSet UUID 목록)`
7. `QuestionChoiceSet` where `questionUuid`
8. `QuestionChoice` where `questionUuid`
9. `Question` 본체

**Repository 변경:**
- 각 자식 Repository 에 `deleteAllByQuestionUuid(UUID)` 추가 (필요 시 `@Modifying @Query` 로 벌크 삭제)
- `QuizSessionRepository.findActiveSessions()` 추가 (진행중 상태 필터)

### 2. 프론트엔드: 문제 목록 삭제 버튼

**대상 파일:** `templates/admin/questions.html` (라인 103-114)

**UI 변경:**
- 각 행 액션 컬럼에 삭제 버튼(🗑️) 추가, 기존 상세/편집 아이콘과 나란히
- 클릭 시 커스텀 확인 모달 노출:

  ```
  제목: 문제를 삭제하시겠습니까?
  본문: "[문제 제목]" 을(를) 삭제합니다.
        이 작업은 되돌릴 수 없으며, 해당 문제의 제출 기록·실행 로그·
        선택지·태그·오늘의 문제 등록 이력이 모두 함께 삭제됩니다.
        진행중인 퀴즈 세션에서 사용 중이면 삭제되지 않습니다.
  버튼: [취소]  [삭제]
  ```

**폼 구조:** Thymeleaf `th:method="delete"` + 숨은 폼

```html
<form th:action="@{/admin/questions/{uuid}(uuid=${q.uuid})}"
      th:method="delete"
      onsubmit="return confirmDelete(this, '[[${q.title}]]')">
  <button type="submit" class="btn-icon btn-danger">🗑️</button>
</form>
```

- flash 성공/에러 메시지는 상단 toast/alert 영역에 노출 (기존 패턴 준수)
- 접근 제어는 기존 관리자 Spring Security 설정 상속

### 3. 프론트엔드: question-edit.html JSON 불러오기

**대상 파일:** `templates/admin/question-edit.html`

**접근 방식:** `question-register.html` 의 인라인 JSON 로직을 공통 JS 로 추출

- 추출 위치: `server/PQL-Web/src/main/resources/static/js/admin/question-json-loader.js`
- 포함 함수: `loadJsonFile(event)`, `openJsonPasteModal()`, `applyJsonFromPaste()`, `applyJson(data)`
- 등록/수정 페이지 모두 `<script src="...">` 로 포함

**UI 배치 (수정 폼):**
- 등록 폼과 동일 위치에 버튼 2개:
  - `[📁 JSON 파일 불러오기]`
  - `[📋 JSON 붙여넣기]`
- **수정 폼 전용 확인 모달**: 불러오기 실행 직전
  > "현재 입력된 내용을 JSON 데이터로 덮어쓰시겠습니까?"

  (등록 폼에는 해당 확인이 없음 — 수정 폼은 기존 값이 이미 채워져 있어 사고 방지 필요)

**검증 항목 (구현 시):**
- `question-register.html` 과 `question-edit.html` 의 폼 필드 `id`/`name` 동일 여부 확인
- 다르면 `question-json-loader.js` 가 양쪽 필드명을 처리하도록 설정 객체 주입 방식 채택

## 변경 파일 요약

**백엔드:**
- `AdminQuestionController.java` — `@DeleteMapping("/{uuid}")` 추가
- `QuestionService.java` — `deleteQuestionCascade(UUID)` 추가
- `QuestionRepository.java` — 필요 시 조회 헬퍼 추가
- 자식 도메인 Repository 8개 — `deleteAllByQuestionUuid(UUID)` 및 관련 메서드 추가
- `QuizSessionRepository.java` — `findActiveSessions()` 추가

**프론트엔드:**
- `templates/admin/questions.html` — 삭제 버튼 + 확인 모달 JS
- `templates/admin/question-edit.html` — JSON 불러오기 버튼 + 덮어쓰기 확인 모달
- `templates/admin/question-register.html` — 인라인 JSON 로직을 공통 JS 호출로 교체
- `static/js/admin/question-json-loader.js` — **신규 파일** (공통 JSON 로더)

## 범위 밖 (Out of Scope)

- Soft delete 도입
- Question 과 관련된 모든 조회 쿼리의 삭제 필터 추가
- 삭제 이력 감사 로그(audit log)
- 벌크 삭제 (다중 선택 삭제)
- 삭제된 문제 복원 기능
