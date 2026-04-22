📅 [기능추가][Server] Exam Schedule 도메인 및 시험 일정 관리 API + 어드민

📝 현재 문제점
---

- 홈 화면 인사말에 노출될 "시험 D-day"를 계산하려면 시험 일정 정보를 DB에서 관리해야 하지만, 현재 관련 도메인이 없습니다.
- SQLD/SQLP 등 자격증 종류와 회차별 일정을 한 곳에서 관리하고, 사용자가 "내 목표 시험" 1개를 선택할 수 있어야 합니다.
- 코드 프리즈 이후에도 신규 회차 등록/선택 변경이 가능해야 하므로 어드민 화면이 필요합니다.

🛠️ 해결 방안 / 제안 기능
---

- `exam_schedule` 신규 테이블을 생성하여 자격증 종류, 회차, 시험일, 선택 여부를 관리합니다.
- 전체 시스템에서 단 하나의 회차만 `is_selected = true`가 되도록 부분 unique index로 강제합니다.
- Flyway 시드로 2026년 SQLD 4개 회차(60~63)를 미리 입력하고, 61회(2026-05-31)를 기본 선택으로 둡니다.
- 사용자 조회용 API와 어드민용 CRUD/선택 토글 API를 함께 제공합니다.

📚 참고 문서
---

- 설계 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md` §4.1, §5.1
- Entity 컨벤션: `server/CLAUDE.md`

⚙️ 작업 내용
---

### 📌 도메인

- [ ] `CertType` enum 정의: `SQLD`, `SQLP`
- [ ] `ExamSchedule extends BaseEntity` 엔티티
  - `examScheduleUuid` UUID PK (`@GeneratedValue(UUID)`)
  - `certType` enum
  - `round` int
  - `examDate` LocalDate
  - `isSelected` boolean
- [ ] `ExamScheduleRepository extends JpaRepository<ExamSchedule, UUID>`
  - `Optional<ExamSchedule> findByIsSelectedTrue()`
  - `List<ExamSchedule> findByCertTypeOrderByExamDateAsc(CertType certType)`
  - `boolean existsByCertTypeAndRound(CertType certType, int round)`

### 📌 Flyway 마이그레이션

- [ ] V?: `exam_schedule` 테이블 생성
  - 컬럼: 위 엔티티 필드 + BaseEntity 필드
  - `UNIQUE(cert_type, round)`
  - 부분 unique index: `CREATE UNIQUE INDEX uq_exam_schedule_selected ON exam_schedule (is_selected) WHERE is_selected = true;`
- [ ] V?+1: SQLD 60~63회 시드 INSERT
  - 60회 2026-03-07 false
  - 61회 2026-05-31 **true**
  - 62회 2026-08-22 false
  - 63회 2026-11-14 false

### 📌 사용자 API

- [ ] `GET /api/exam-schedules?certType=SQLD` — 회차 리스트 조회
- [ ] `GET /api/exam-schedules/selected` — 현재 선택된 회차 1개 (없으면 200 + null)
- [ ] DTO: `ExamScheduleResponse { examScheduleUuid, certType, round, examDate, isSelected }`

### 📌 어드민 API

- [ ] `GET /admin/exam-schedules?certType=` — 전체 리스트
- [ ] `POST /admin/exam-schedules` — 회차 추가
  - body: `{ certType, round, examDate }`
  - `(certType, round)` 중복 시 409
- [ ] `PUT /admin/exam-schedules/{uuid}/select` — 선택 토글
  - 트랜잭션으로 다른 모든 행을 false 처리 후 대상 행을 true로 업데이트
- [ ] `DELETE /admin/exam-schedules/{uuid}` — 회차 삭제
  - 선택된 행 삭제 시 다른 행 자동 선택 안 함 (greeting이 fallback 처리)

### 📌 어드민 화면 (Thymeleaf, D5)

- [ ] `/admin/exam-schedules` 페이지
  - 자격증 필터 드롭다운 (SQLD/SQLP/전체)
  - 회차 테이블 (round, examDate, isSelected, actions)
  - "선택" 버튼 (라디오), "삭제" 버튼
  - 상단 "회차 추가" 폼 (certType, round, examDate)

### ✅ 검증 / 테스트

- [ ] 단위 테스트: select 토글 시 다른 행 false 처리
- [ ] curl 검증: `/api/exam-schedules/selected` → SQLD 61회 응답
- [ ] 부분 unique index 동작 확인 (두 행을 동시에 true로 만들면 실패)

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
