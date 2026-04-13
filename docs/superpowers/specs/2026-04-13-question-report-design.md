# 문제 신고 기능 설계

## 개요

AI가 생성한 선택지/문제에 오류가 있을 수 있어, 사용자가 문제를 신고하고 관리자가 처리할 수 있는 기능을 제공한다.
문제를 풀고 난 후 결과 바텀시트에서 신고 버튼을 통해 접근한다.

---

## 1. 데이터 모델

### 모듈 배치
- **엔티티**: `PQL-Domain-Question`
- **서비스 (처리 로직)**: `PQL-Application`
- **컨트롤러**: `PQL-Web`

### QuestionReport 엔티티

```java
// PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionReport.java
@Entity
public class QuestionReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID questionReportUuid;

    @Column(nullable = false)
    private UUID questionUuid;

    @Column(nullable = true)
    private UUID choiceSetUuid;  // 선택지 관련 신고 시에만 존재

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private UUID submissionUuid;  // 신고 시점 제출 건

    @ElementCollection
    @CollectionTable(name = "question_report_category")
    @Enumerated(EnumType.STRING)
    private List<ReportCategory> categories;

    @Column(nullable = true)
    private String detail;  // 기타 자유 텍스트

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;  // PENDING / RESOLVED

    @Column(nullable = true)
    private LocalDateTime resolvedAt;

    @Column(nullable = true)
    private UUID resolvedBy;  // 처리한 관리자 memberUuid

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private CorrectionScope correctionScope;  // NONE / QUESTION_WIDE / CHOICE_SET_ONLY

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionUuid", insertable = false, updatable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "choiceSetUuid", insertable = false, updatable = false)
    private QuestionChoiceSet choiceSet;
}
```

### ReportCategory Enum

```java
public enum ReportCategory {
    WRONG_ANSWER,      // 정답이 틀렸다
    WEIRD_QUESTION,    // 문제 자체가 이상하다
    WEIRD_CHOICES,     // 선택지가 이상하다
    WEIRD_EXECUTION,   // SQL 실행 결과가 이상하다
    ETC                // 기타
}
```

### ReportStatus Enum

```java
public enum ReportStatus {
    PENDING,   // 미처리
    RESOLVED   // 처리완료
}
```

### CorrectionScope Enum

```java
public enum CorrectionScope {
    NONE,             // 보정 없음
    QUESTION_WIDE,    // 해당 questionUuid 전체 오답 제출 보정
    CHOICE_SET_ONLY   // 해당 choiceSetUuid 기준 오답 제출만 보정
}
```

### question_report_category 테이블

```sql
question_report_category
├── report_uuid  UUID FK → question_report
├── category     VARCHAR (ReportCategory enum 값)
```

### 제약조건

- `memberUuid` + `submissionUuid` 조합 유니크 → 동일 제출 건에 중복 신고 불가
- `choiceSetUuid`는 nullable — 문제 자체 신고 시 없을 수 있음
- `correctionScope`는 RESOLVED 처리 시에만 세팅
- `CHOICE_SET_ONLY` 보정은 해당 신고 건의 `choiceSetUuid`가 non-null인 경우에만 허용 (null이면 API에서 400 반환)

---

## 2. API 설계

### 사용자 API

#### 문제 신고 제출
```
POST /api/questions/{questionUuid}/report
Header: X-Member-UUID: {memberUuid}
Body:
{
  "choiceSetUuid": "uuid (nullable)",
  "submissionUuid": "uuid (필수)",
  "categories": ["WRONG_ANSWER", "WEIRD_CHOICES"],
  "detail": "기타 내용 (nullable)"
}
Response: 201 Created
```

**제약:**
- `categories` 최소 1개 이상 필수
- `ETC` 선택 시 `detail` 필수
- 동일 `submissionUuid`로 중복 신고 시 `REPORT_ALREADY_EXISTS` 에러

#### 신고 여부 조회
```
GET /api/questions/{questionUuid}/report/status?submissionUuid={submissionUuid}
Header: X-Member-UUID: {memberUuid}
Response: { "reported": true | false }
```
→ 프론트엔드에서 신고 버튼 비활성화 여부 판단용

---

### 관리자 API

#### 문제별 집계 목록
```
GET /admin/api/reports?status=PENDING&page=0&size=20
Response:
{
  "content": [
    {
      "questionUuid": "...",
      "questionStem": "SELECT 기본 문법...",
      "totalCount": 12,
      "pendingCount": 10,
      "categoryDistribution": {
        "WRONG_ANSWER": 8,
        "WEIRD_CHOICES": 4
      },
      "latestReportedAt": "2026-04-13T14:22:00"
    }
  ],
  "totalElements": 5
}
```

#### 특정 문제 신고 건 목록
```
GET /admin/api/reports/{questionUuid}
Response:
{
  "question": {
    "questionUuid": "...",
    "stem": "...",
    "status": "ACTIVE"
  },
  "reports": [
    {
      "reportUuid": "...",
      "memberUuid": "...",
      "submissionUuid": "...",
      "choiceSetUuid": "...",
      "categories": ["WRONG_ANSWER"],
      "detail": "선택지 B가 정답인 것 같은데요",
      "status": "PENDING",
      "createdAt": "2026-04-13T14:22:00"
    }
  ]
}
```

#### 신고 처리 (resolve)
```
POST /admin/api/reports/{reportUuid}/resolve
Header: X-Member-UUID: {adminMemberUuid}
Body:
{
  "correctionScope": "NONE | QUESTION_WIDE | CHOICE_SET_ONLY",
  "deactivateQuestion": true | false
}
Response: 200 OK
```

**처리 흐름 (QuestionReportService in PQL-Application):**
1. `QuestionReport.status` → `RESOLVED`, `resolvedAt`, `resolvedBy`, `correctionScope` 세팅
2. `deactivateQuestion: true`이면 `Question.status` → `INACTIVE`
3. `correctionScope`에 따라 Submission 소급 보정:
   - `QUESTION_WIDE` → 해당 `questionUuid`의 전체 오답 Submission을 `isCorrect = true`로 업데이트
   - `CHOICE_SET_ONLY` → 해당 `choiceSetUuid` 기준 오답 Submission만 보정
   - `NONE` → 보정 없음

---

## 3. ErrorCode 추가

```java
// PQL-Common ErrorCode 추가
REPORT_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 신고한 제출입니다."),
REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "신고를 찾을 수 없습니다."),
REPORT_ALREADY_RESOLVED(HttpStatus.BAD_REQUEST, "이미 처리된 신고입니다."),
```

---

## 4. 프론트엔드

### 신고 버튼 위치

결과 바텀시트(PracticeResult 화면) 우측 상단 또는 하단 영역에 신고 아이콘 버튼.
- 이미 신고한 경우: 버튼 비활성화 + "신고 완료" 텍스트

### 신고 모달 (daisyUI modal)

```
┌─────────────────────────────┐
│ 문제 신고              [✕]  │
├─────────────────────────────┤
│ ☐ 정답이 틀렸다              │
│ ☐ 문제 자체가 이상하다        │
│ ☐ 선택지가 이상하다           │
│ ☐ SQL 실행 결과가 이상하다    │
│ ☐ 기타                      │
│   └ [textarea: 내용 입력]   │
├─────────────────────────────┤
│              [취소] [신고하기]│
└─────────────────────────────┘
```

- 하나 이상 선택해야 신고하기 버튼 활성화
- ETC 선택 시 textarea 표시 (필수 입력)
- 제출 성공 시 daisyUI toast "신고가 접수되었습니다"
- 로딩 중 버튼 disabled 처리

### 관리자 화면

#### `/admin/reports` — 문제별 집계 목록
- daisyUI table
- 미처리만 보기 토글 (기본값: 미처리)
- 컬럼: 신고 수 / 문제 줄기 / 카테고리 분포 / 상태 / 최근 신고일
- 행 클릭 → `/admin/reports/{questionUuid}`

#### `/admin/reports/{questionUuid}` — 신고 상세
- 상단: 문제 전체 내용 표시 (stem, choiceSet 포함)
- 신고 건 카드 목록 (카테고리, detail, 날짜, 제출 정보)
- 하단 일괄 처리 영역:
  - 보정 범위 라디오 (없음 / 문제 전체 / 선택지 세트 기준)
  - 문제 비활성화 체크박스
  - 선택 건 처리완료 버튼

---

## 5. Flyway 마이그레이션

새 파일: `V0_0_X__add_question_report.sql`

```sql
CREATE TABLE IF NOT EXISTS question_report (
    question_report_uuid UUID PRIMARY KEY,
    question_uuid        UUID NOT NULL,
    choice_set_uuid      UUID,
    member_uuid          UUID NOT NULL,
    submission_uuid      UUID NOT NULL,
    detail               TEXT,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolved_at          TIMESTAMP,
    resolved_by          UUID,
    correction_scope     VARCHAR(30),
    created_at           TIMESTAMP NOT NULL,
    updated_at           TIMESTAMP NOT NULL,
    created_by           VARCHAR(50),
    updated_by           VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS question_report_category (
    report_uuid UUID NOT NULL REFERENCES question_report(question_report_uuid),
    category    VARCHAR(30) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_member_submission
    ON question_report(member_uuid, submission_uuid);
```

---

## 6. 구현 범위 (1차)

| 항목 | 포함 여부 |
|------|----------|
| 사용자 신고 제출 API | ✅ |
| 신고 여부 조회 API | ✅ |
| 관리자 집계 목록 API | ✅ |
| 관리자 신고 상세 API | ✅ |
| 관리자 resolve API (상태변경 + 비활성화 + 보정) | ✅ |
| 프론트엔드 신고 모달 | ✅ |
| 관리자 신고 관리 화면 | ✅ |
| 사용자에게 처리 결과 알림 | ❌ (2차) |
| 보정 이력 별도 테이블 관리 | ❌ (2차) |
