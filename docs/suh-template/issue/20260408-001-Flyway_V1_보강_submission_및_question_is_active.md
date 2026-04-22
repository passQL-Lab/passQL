🗄️ [Infra][Flyway] V1 스키마 보강 — submission 테이블 및 question.is_active 컬럼 추가

📝 현재 문제점
---

- D3에 추가될 홈 화면 백엔드 API들(`/api/progress`, `/api/questions/today`)이 `submission` 테이블과 `question.is_active` 컬럼에 의존하지만, 현재 Flyway V1 스키마에 누락되어 있습니다.
- `submission` 테이블은 D4 작업으로 예정되어 있으나, D3의 정답률/스트릭/오늘 챌린지 풀이 여부 계산에 선행 의존이 필요합니다.
- `question.is_active`가 없으면 데일리 챌린지 폴백 로직(활성 문제 풀에서 결정적 선택)이 동작하지 않습니다.
- 다른 D3 도메인 이슈들의 전제 조건이므로 가장 먼저 머지되어야 합니다.

🛠️ 해결 방안 / 제안 기능
---

- Flyway V1 또는 후속 마이그레이션에 `submission` 테이블 스키마를 추가합니다.
- `question` 테이블에 `is_active BOOLEAN NOT NULL DEFAULT TRUE` 컬럼을 추가합니다.
- 모든 PK는 UUID(`@GeneratedValue(UUID)`), 컬럼명은 camelCase Java 필드 → snake_case 자동 변환을 따릅니다.
- 인덱스는 자주 조회되는 컬럼(`memberUuid`, `submittedAt`)에 추가합니다.

📚 참고 문서
---

- 설계 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md`
- Entity 컨벤션: `server/CLAUDE.md` §Entity 작성 규칙

⚙️ 작업 내용
---

### 📌 submission 테이블

- [ ] `submission` 테이블 생성 마이그레이션 작성
  - `submission_uuid` CHAR(36) PK
  - `member_uuid` CHAR(36) FK → member
  - `question_uuid` CHAR(36) FK → question
  - `selected_choice_key` VARCHAR(8) (예: A/B/C/D)
  - `is_correct` BOOLEAN NOT NULL
  - `submitted_at` TIMESTAMP NOT NULL
  - `created_at`, `updated_at` (BaseEntity)
- [ ] 인덱스
  - `idx_submission_member_uuid` on (`member_uuid`)
  - `idx_submission_member_submitted` on (`member_uuid`, `submitted_at` DESC)
  - `idx_submission_member_question` on (`member_uuid`, `question_uuid`)

### 📌 question.is_active 컬럼

- [ ] `question` 테이블에 `is_active BOOLEAN NOT NULL DEFAULT TRUE` 추가
- [ ] 기존 행은 모두 TRUE로 백필
- [ ] `idx_question_active` on (`is_active`) — 활성 문제 풀 조회 최적화

### ✅ 검증

- [ ] 로컬 부팅 시 마이그레이션 정상 적용 확인
- [ ] `\d submission` / `\d question`으로 컬럼/인덱스 검증
- [ ] D3 후속 작업(#2~#6)이 본 마이그레이션을 전제로 진행 가능한지 확인

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
