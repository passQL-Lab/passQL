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
- `hibernate.ddl-auto`는 `update` 모드 — Flyway는 보조 수단, Hibernate가 실제 스키마를 관리함
- **Entity를 추가/변경하면 반드시 대응하는 마이그레이션 파일을 함께 작성해야 한다**
- 기존 마이그레이션 파일은 절대 수정하지 말 것 (새 버전 파일로 추가)
- SQL 작성 시 테이블/컬럼 생성은 반드시 `IF NOT EXISTS` 사용, 삭제는 `IF EXISTS` 사용

### 현재 마이그레이션 이력

| 버전 | 파일 | 내용 |
|------|------|------|
| V0_0_11 | `V0_0_11__init_schema.sql` | 초기 스키마 전체 생성 (topic, subtopic, concept_tag, concept_doc, prompt_template, app_setting, question, question_choice) |
| V0_0_12 | `V0_0_12__add_submission_tables.sql` | submission, execution_log 테이블 추가 |

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

---

## Entity 작성 규칙 (필수)

### PK는 무조건 `java.util.UUID`

- **모든 Entity의 PK는 `UUID` 타입**을 사용한다. `Long`/IDENTITY/SEQUENCE 사용 금지.
- JPA가 자동으로 랜덤 UUID를 생성하도록 `@GeneratedValue(strategy = GenerationType.UUID)`를 사용한다.
- PK 컬럼명은 `{도메인}Uuid` 형식 (예: `memberUuid`, `questionUuid`, `submissionUuid`).
- 외부 API 노출 식별자도 동일한 PK UUID를 그대로 사용한다 (별도 외부 식별자 컬럼을 두지 않는다).

```java
@Id
@GeneratedValue(strategy = GenerationType.UUID)
@Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
private UUID memberUuid;
```

### Lombok / 생성자

- `@Getter` + `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 기본.
- `@Setter` 사용 허용. 잘 활용하면 오버라이드/유연성 측면에서 이점이 있다.

### Enum

- Enum은 `constant/` 패키지에 분리한다.
- DB 매핑은 `@Enumerated(EnumType.STRING)` 고정 (ORDINAL 금지).

### 인덱스 / 제약

- `@Table(indexes = ..., uniqueConstraints = ...)`로 명시한다.

---

## 코드 배치 규칙 (중요)

### Config는 무조건 PQL-Web

- 모든 `@Configuration` 클래스는 `PQL-Web/src/main/java/com/passql/web/config/` 에 둔다.
- Domain 모듈 안에 Config를 두지 않는다.
- 예: `JpaAuditingConfig`, `SuhRandomKitConfig`, `SwaggerConfig`, `WebMvcConfig`.

### 로직적 유틸은 PQL-Common/util

- 도메인에 종속되지 않는 순수 로직 유틸은 `PQL-Common/src/main/java/com/passql/common/util/` 에 둔다.
- 예: `NicknameGenerator` (SuhRandomKit 래핑 + 중복 회피 알고리즘), `UuidUtils` 등.
- Service에서는 이 유틸을 주입받아 호출만 한다 (테스트 용이성 확보).

### Controller는 PQL-Web/controller

- 모든 REST Controller는 `PQL-Web/src/main/java/com/passql/web/controller/` 에 둔다.
- Domain 모듈에는 Controller를 두지 않는다.

### DTO 위치

- 요청/응답 DTO는 해당 Domain 모듈의 `dto/` 에 둔다.
- Controller는 Domain DTO를 그대로 반환한다.

---

## 패키지 컨벤션

- 패키지 루트: `com.passql.{module}` (예: `com.passql.member`, `com.passql.question`).
- 표준 하위 패키지: `entity`, `repository`, `service`, `dto`, `constant`, `exception`.

## Repository 컨벤션

- `JpaRepository<Entity, UUID>` — 두 번째 제네릭은 항상 `UUID`.
- 메서드명은 Spring Data JPA 명명 규칙 준수.

## Service 컨벤션

- `@Service` + 생성자 주입(`@RequiredArgsConstructor`).
- 클래스 레벨 `@Transactional(readOnly = true)` + 변경 메서드에 `@Transactional` 재선언.

## 외부 라이브러리 / 저장소

- 사내 라이브러리(`me.suhsaechan:*`)는 Suh-Nexus Maven 저장소를 사용한다:
  - URL: `http://suh-project.synology.me:9999/repository/maven-releases/`
  - `allowInsecureProtocol = true`
- 루트 `build.gradle`의 `allprojects.repositories`에 등록한다.

## 작업 시 체크리스트

- [ ] PK가 `UUID` + `@GeneratedValue(strategy = GenerationType.UUID)` 인가?
- [ ] BaseEntity 상속했는가?
- [ ] Config가 `PQL-Web/config`에 있는가?
- [ ] 순수 유틸이 `PQL-Common/util`에 있는가?
- [ ] Controller가 `PQL-Web/controller`에 있는가?
- [ ] Enum이 `constant/`에 있고 `EnumType.STRING`인가?
- [ ] Entity 추가/변경 시 Flyway 마이그레이션 파일도 함께 작성했는가?
