# passQL Spring Server - Claude 가이드

## 버전 관리 규칙

**버전은 반드시 프로젝트 루트의 `version.yml`을 따른다.**

- `version.yml`의 `version` 값이 Spring 앱의 유일한 버전 기준
- `build.gradle`의 `version`을 직접 수정하지 말 것 — GitHub Actions가 `version.yml` 기준으로 자동 동기화함
- 버전 변경이 필요하면 `version.yml`만 수정할 것

## DB 스키마 관리 규칙

**Flyway 마이그레이션으로만 스키마를 변경한다.**

- 마이그레이션 파일 위치: `PQL-Web/src/main/resources/db/migration/`
- 파일 네이밍: `V{version.yml의 version값}__{설명}.sql` — 점(.)은 언더스코어(_)로 치환
  - 예: `version: "0.0.11"` → `V0_0_11__add_user_table.sql`
- `hibernate.ddl-auto`는 `validate` 모드 — Hibernate가 스키마를 자동 생성/수정하지 않음
- **Entity를 추가/변경하면 반드시 대응하는 마이그레이션 파일을 함께 작성해야 한다**
- 기존 마이그레이션 파일은 절대 수정하지 말 것 (새 버전 파일로 추가)
- SQL 작성 시 테이블/컬럼 생성은 반드시 `IF NOT EXISTS` 사용, 삭제는 `IF EXISTS` 사용

### 현재 마이그레이션 이력

| 버전 | 파일 | 내용 |
|------|------|------|
| V0_0_11 | `V0_0_11__init_schema.sql` | 초기 스키마 전체 생성 (topic, subtopic, concept_tag, concept_doc, prompt_template, app_setting, question, question_choice) |

## 모듈 구조

```
server/
├── PQL-Web/          # 웹 레이어 (Controller, 설정, 리소스)
├── PQL-Common/       # 공통 (BaseEntity 등)
├── PQL-Domain-Meta/  # 메타 도메인 (topic, subtopic, concept, app_setting, prompt)
└── PQL-Domain-Question/ # 문제 도메인 (question, question_choice)
```

## BaseEntity

`PQL-Common`의 `BaseEntity`를 상속하면 아래 컬럼이 자동으로 포함된다:
- `created_at`, `updated_at` (DATETIME(6))
- `created_by`, `updated_by` (VARCHAR(255))
