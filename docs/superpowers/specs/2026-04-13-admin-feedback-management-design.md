# 관리자 건의사항 관리 설계 스펙

- **관련 이슈**: passQL-Lab/passQL#200 (Feedback API 구현) 연장
- **작성일**: 2026-04-13
- **담당**: Cassiiopeia (BE)

---

## 1. 개요

기존 사용자용 Feedback API(POST /api/feedback, GET /api/feedback/me)에 더해,  
관리자가 전체 건의사항을 조회하고 상태를 변경할 수 있는 관리자 화면과 API를 추가한다.

---

## 2. 추가 범위

| 분류 | 내용 |
|------|------|
| 관리자 페이지 | `GET /admin/feedbacks` — 전체 건의사항 목록 (Thymeleaf) |
| 관리자 API | `POST /admin/feedbacks/{feedbackUuid}/status` — 상태 변경 |
| 기존 수정 | `members/list.html` — 눈깔 아이콘 제거, 행 전체 클릭 시 상세 이동 |
| 사이드바 | `layout.html` — 건의사항 메뉴 항목 추가 |

---

## 3. 파일 구조

```
PQL-Domain-Meta/
└── meta/
    ├── service/FeedbackService.java        (수정) getAllFeedbacks(), updateStatus() 추가
    ├── repository/FeedbackRepository.java  (수정) findAllByOrderByCreatedAtDesc(Pageable) 추가
    └── dto/
        ├── FeedbackAdminResponse.java      (신규) 관리자용 목록 응답 DTO
        └── FeedbackStatusUpdateRequest.java (신규) 상태 변경 요청 DTO

PQL-Web/
├── controller/admin/
│   └── AdminFeedbackController.java        (신규) @Controller
└── resources/
    └── templates/admin/
        ├── layout.html                     (수정) 건의사항 메뉴 항목 추가
        ├── feedbacks.html                  (신규) 건의사항 목록 + 모달 + 상태 변경
        └── members/list.html               (수정) 눈깔 아이콘 제거, 행 클릭 → 상세 이동
```

---

## 4. 관리자 페이지 상세

### 4.1 URL 및 컨트롤러

```
GET  /admin/feedbacks                          목록 페이지 (Thymeleaf)
POST /admin/feedbacks/{feedbackUuid}/status    상태 변경 (fetch + @ResponseBody)
```

### 4.2 목록 테이블 컬럼

| 컬럼 | 내용 | 비고 |
|------|------|------|
| 회원 UUID | memberUuid 앞 8자리 | 클릭 시 `/admin/members/{memberUuid}` 이동 |
| 내용 | content 최대 50자 + "..." | 클릭 시 모달로 전체 내용 표시 |
| 상태 | pill 배지 | PENDING=노랑, REVIEWED=인디고, APPLIED=초록 |
| 제출일 | createdAt (yyyy-MM-dd) | |
| 상태 변경 | select + 변경 버튼 | fetch POST, 성공 시 location.reload() |

### 4.3 모달

- 내용 셀 클릭 시 DaisyUI modal 팝업
- 모달 내용: 회원 UUID, 전체 content, 상태, 제출일시
- 닫기 버튼으로 모달 종료

### 4.4 페이지네이션

- 기본값: page=0, size=20, 최신순
- DaisyUI join 버튼 (기존 members/list.html 패턴 그대로)
- 필터 없음 (건의사항은 단순 목록)

### 4.5 사이드바

`layout.html`에 시험 일정(`/admin/exam-schedules`) 다음에 추가:

```html
<li>
    <a th:href="@{/admin/feedbacks}" th:classappend="${currentMenu == 'feedbacks'} ? 'active'">
        <i data-lucide="message-circle" class="size-5"></i>
        건의사항
    </a>
</li>
```

---

## 5. 백엔드 추가 사항

### 5.1 FeedbackRepository 추가 메서드

```java
Page<Feedback> findAllByOrderByCreatedAtDesc(Pageable pageable);
```

### 5.2 FeedbackService 추가 메서드

```java
// 전체 목록 (관리자용, 페이지네이션)
public Page<FeedbackAdminResponse> getAllFeedbacks(Pageable pageable)

// 상태 변경 (관리자 전용)
@Transactional
public void updateStatus(UUID feedbackUuid, FeedbackStatus status)
```

`updateStatus`: feedbackUuid로 Feedback 조회 → 없으면 `CustomException(ErrorCode.FEEDBACK_NOT_FOUND)` → status 변경

### 5.3 신규 ErrorCode

```java
// Feedback (기존에 추가)
FEEDBACK_NOT_FOUND(HttpStatus.NOT_FOUND, "건의사항을 찾을 수 없습니다."),
```

### 5.4 FeedbackAdminResponse DTO

```java
feedbackUuid, memberUuid, content, status(String), createdAt
정적 팩토리: from(Feedback f)
```

### 5.5 FeedbackStatusUpdateRequest DTO

```java
status (String) — "PENDING" / "REVIEWED" / "APPLIED"
```

---

## 6. 회원 목록 수정

`members/list.html`:
- `<th>상세</th>` 컬럼 및 눈깔 아이콘 버튼(`<td>...<a><i data-lucide="eye">...</a></td>`) 제거
- `<tr>` 태그에 `onclick` 추가:  
  `onclick="location.href='/admin/members/{uuid}'"` (Thymeleaf로 uuid 바인딩)
- `<tr>` 태그에 `class="cursor-pointer hover:bg-base-200"` 추가

---

## 7. 구현 체크리스트

- [ ] `ErrorCode`에 `FEEDBACK_NOT_FOUND` 추가
- [ ] `FeedbackRepository` — `findAllByOrderByCreatedAtDesc(Pageable)` 추가
- [ ] `FeedbackAdminResponse` DTO 추가
- [ ] `FeedbackStatusUpdateRequest` DTO 추가
- [ ] `FeedbackService` — `getAllFeedbacks()`, `updateStatus()` 추가
- [ ] `AdminFeedbackController` 추가
- [ ] `feedbacks.html` Thymeleaf 페이지 추가 (목록 + 모달 + 상태 변경)
- [ ] `layout.html` — 건의사항 사이드바 메뉴 추가
- [ ] `members/list.html` — 눈깔 아이콘 제거, 행 클릭 이동 추가
