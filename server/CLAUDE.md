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
- **마이그레이션 파일 작성 전 반드시 프로젝트 루트 `version.yml`을 먼저 읽어 현재 버전을 확인한다**
- **하나의 version.yml 버전당 마이그레이션 파일은 반드시 1개만 작성한다** — DDL과 DML을 분리하고 싶어도 하나의 파일에 통합할 것. Flyway는 같은 버전 prefix 파일 2개를 허용하지 않는다
- 이미 구현된 마이그레이션이 있으면 다시 만들지 않는다 — 이력 표를 먼저 확인한 뒤 누락된 것만 추가
- `hibernate.ddl-auto`는 `update` 모드 — Flyway는 보조 수단, Hibernate가 실제 스키마를 관리함
- **Entity를 추가/변경하면 반드시 대응하는 마이그레이션 파일을 함께 작성해야 한다**
- 기존 마이그레이션 파일은 절대 수정하지 말 것 (새 버전 파일로 추가)
- SQL 작성 시 테이블/컬럼 생성은 반드시 `IF NOT EXISTS` 사용, 삭제는 `IF EXISTS` 사용
- 시드 INSERT는 `ON DUPLICATE KEY UPDATE`로 멱등성을 보장한다

### 현재 마이그레이션 이력

| 버전 | 파일 | 내용 |
|------|------|------|
| V0_0_11 | `V0_0_11__init_schema.sql` | 초기 스키마 전체 생성 (topic, subtopic, concept_tag, concept_doc, prompt_template, app_setting, question, question_choice) |
| V0_0_12 | `V0_0_12__add_submission_tables.sql` | submission, execution_log 테이블 추가 |
| V0_0_16 | `V0_0_16__add_member_table.sql` | member 테이블 추가 |
| V0_0_21 | `V0_0_21__add_concept_tag_table.sql` | question_concept_tag 매핑 테이블 추가 + 초기 시드 데이터 적재 (app_setting 13개, prompt_template 3종, topic 9개) |

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

### 컬럼 네이밍 — `@Column(name = ...)` 금지

- **`@Column(name = "snake_case")` 같이 컬럼명을 수동으로 지정하지 않는다.**
- Hibernate의 기본 Physical Naming Strategy(`SpringPhysicalNamingStrategy`)가 camelCase Java 필드명을 자동으로 snake_case로 변환한다. 그걸 그대로 믿는다.
  - `memberUuid` → `member_uuid`
  - `isTestAccount` → `is_test_account`
  - `lastSeenAt` → `last_seen_at`
- `@Column`은 **제약 속성(`length`, `nullable`, `columnDefinition`, `updatable` 등)이 필요할 때만** 사용한다. `name` 속성은 붙이지 않는다.
- `@Table(indexes = @Index(columnList = "..."))`의 `columnList`에 컬럼명을 적을 때도 Hibernate가 변환할 snake_case 이름을 그대로 문자열로 쓴다 (예: `"is_test_account"`).
- Flyway 마이그레이션 SQL의 컬럼명도 동일한 snake_case 규칙을 따른다 (Entity ↔ SQL 정합성 유지).

### Boolean 필드는 `Boolean` 래퍼로, `is` 접두사 허용

- **Boolean 필드는 primitive `boolean`이 아니라 래퍼 `Boolean`을 사용한다.**
- Lombok `@Getter`는 primitive `boolean`에 대해 `isXxx()` 형태 getter를 생성하는데, 이 규칙이 필드명이 `is`로 시작하면 getter 이름을 덮어쓰는 등 혼동을 유발한다. `Boolean` 래퍼를 사용하면 `getIsXxx()` 로 getter가 명확히 생성된다.
- **필드명에 `is` 접두사를 붙이는 것은 허용한다.** (`isTestAccount`, `isDeleted`, `emailVerified` 등) — 단, 위 이유로 타입은 반드시 `Boolean`이어야 한다.
- DTO에서도 동일 규칙. NPE가 걱정되면 생성 시점에 기본값을 주되, 타입 자체는 `Boolean`을 유지한다.

```java
// OK
@Column(nullable = false)
private Boolean isTestAccount;

// 금지: primitive boolean + is 접두사
private boolean isTestAccount;
```

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
- [ ] `@Column(name = ...)`를 붙이지 않고 Hibernate 기본 naming strategy에 맡겼는가?
- [ ] Boolean 필드는 `Boolean` 래퍼 타입인가? (primitive `boolean` 금지)
- [ ] Entity 추가/변경 시 Flyway 마이그레이션 파일도 함께 작성했는가?
- [ ] 마이그레이션 파일 작성 전 `version.yml`을 읽어 현재 버전을 확인했는가?
- [ ] 동일 버전으로 파일이 2개 이상 생성되지 않았는가? (버전당 파일 1개 원칙)
- [ ] 이미 존재하는 마이그레이션을 중복 생성하지 않았는가? (이력 표 먼저 확인)
