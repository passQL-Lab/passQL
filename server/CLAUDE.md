# passQL Spring Server - Claude 가이드

## 보안 정책

### Spring Security 인증 구조

- `/admin/**` 경로: 세션 기반 폼 로그인 (`AdminSecurityConfig`, `@Order(1)`)
- `/api/**` 경로: JWT 무상태 인증 (`SecurityConfig`, `@Order(2)`)
- 관리자 계정은 환경변수(`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`)로 관리

---

## Thymeleaf 템플릿 작성 규칙 (중요)

### onclick에서 서버 변수 사용 금지 — data-* 패턴 필수

Thymeleaf 3.1부터 `th:onclick` 및 모든 DOM 이벤트 속성(`th:onchange`, `th:onsubmit` 등)에서 **숫자/boolean 이외의 변수(String, UUID 등)를 직접 사용할 수 없다.**

```
TemplateProcessingException: Only variable expressions returning numbers or booleans
are allowed in this context
```

이 에러는 UUID, 문자열 코드값 등을 onclick에 직접 넣을 때 반드시 발생한다.

**금지 패턴:**
```html
<!-- ❌ th:onclick에 String/UUID 직접 삽입 — 에러 발생 -->
<tr th:onclick="|location.href='/admin/members/' + ${m.memberUuid}|">
<button th:onclick="|doSomething('${item.code}')|">
```

**올바른 패턴 — data-* 속성으로 분리:**
```html
<!-- ✅ th:data-* 에 값을 담고, onclick은 순수 JS로 -->
<tr th:data-href="@{/admin/members/{uuid}(uuid=${m.memberUuid})}"
    onclick="location.href=this.dataset.href">

<button th:data-uuid="${f.feedbackUuid}"
        onclick="doSomething(this.dataset.uuid)">
```

- `th:data-href`, `th:data-uuid`, `th:data-code` 등 `data-*` 속성에 Thymeleaf 표현식을 넣는다
- `onclick` 속성은 `th:` 없이 순수 JS로만 작성하고 `this.dataset.*`으로 값을 읽는다
- URL 생성은 `@{/path/{var}(var=${value})}` 문법을 사용한다 (Thymeleaf URL 빌더)

### UUID를 URL에 삽입할 때는 @{} URL 빌더 사용

```html
<!-- ❌ 문자열 연결 — UUID가 String이므로 onclick 컨텍스트에서 금지 -->
th:data-href="'/admin/members/' + ${m.memberUuid}"

<!-- ✅ Thymeleaf URL 빌더 사용 -->
th:data-href="@{/admin/members/{uuid}(uuid=${m.memberUuid})}"
```

---

## 버전 관리 규칙

**버전은 반드시 프로젝트 루트의 `version.yml`을 따른다.**

- `version.yml`의 `version` 값이 Spring 앱의 유일한 버전 기준
- `build.gradle`의 `version`을 직접 수정하지 말 것 — GitHub Actions가 `version.yml` 기준으로 자동 동기화함
- 버전 변경이 필요하면 `version.yml`만 수정할 것

## DB 스키마 관리 규칙

**Flyway 마이그레이션으로만 스키마를 변경한다.**

> ⛔ **마이그레이션 파일에 민감한 값 절대 금지**
> API Key, 비밀번호, 토큰, 인증 키 등 민감한 실제 값을 SQL 파일에 직접 작성하지 않는다.
> 마이그레이션 파일은 GitHub에 올라가는 공개 파일이다.
> app_setting에 민감한 키를 INSERT할 때는 반드시 빈 값(`''`)으로 삽입하고,
> 실제 값은 배포 후 관리자 화면에서 직접 입력한다.

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
@Column(updatable = false, nullable = false)
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

### Controller 역할 제한 (중요)

- **Controller는 요청/응답 변환과 Model 바인딩만 담당한다. 비즈니스 로직을 두지 않는다.**
- **Controller에서 Repository를 직접 주입하지 않는다.** 반드시 Service를 통해 호출한다.
  - 금지: `private final ConceptTagRepository conceptTagRepository;` (Controller에서)
  - 허용: `private final MetaService metaService;`
- **`@Transactional`을 Controller에 선언하지 않는다.** 트랜잭션은 Service 레이어에서만 관리한다.
- Controller에 조건/변환 로직이 3줄 이상이면 Service 메서드로 추출한다.

### DTO 위치

- 요청/응답 DTO는 해당 Domain 모듈의 `dto/` 에 둔다.
- Controller는 Domain DTO를 그대로 반환한다.

### API 변경 시 문서 관리

- **API를 추가/변경/삭제하면 반드시 Controller DOCS에 정보를 추가한다.**
- 다음과 같은형식으로 추가필요   @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 에러 AI 해설 API 추가"),

---

## 패키지 컨벤션

- 패키지 루트: `com.passql.{module}` (예: `com.passql.member`, `com.passql.question`).
- 표준 하위 패키지: `entity`, `repository`, `service`, `dto`, `constant`, `exception`.

## Repository 컨벤션

- `JpaRepository<Entity, UUID>` — 두 번째 제네릭은 항상 `UUID`.
- 메서드명은 Spring Data JPA 명명 규칙 준수.

## 예외 처리 규칙 (중요)

- **비즈니스 예외는 반드시 `CustomException(ErrorCode.XXX)`만 사용한다.**
- **도메인별 `RuntimeException` 서브클래스(`XxxException`) 생성 금지** — `SqlSafetyException`, `MemberNotFoundException` 같은 개별 예외 클래스를 만들지 않는다.
- 새 에러 타입이 필요하면 `PQL-Common`의 `ErrorCode` enum에 항목을 추가한다.
- `GlobalExceptionHandler`는 `PQL-Common`에서 중앙 관리 — 도메인 모듈에 `@ControllerAdvice`를 두지 않는다.

```java
// 금지
throw new SqlSafetyException("SELECT만 허용됩니다");

// 올바른 방법
throw new CustomException(ErrorCode.NOT_SELECT);
```

### ErrorCode 추가 방법
`PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`에 카테고리에 맞게 추가:
```java
// Sandbox 카테고리 예시
SQL_SAFETY_VIOLATION(HttpStatus.BAD_REQUEST, "허용되지 않는 SQL입니다."),
```

---

## Service 컨벤션

- `@Service` + 생성자 주입(`@RequiredArgsConstructor`).
- 클래스 레벨 `@Transactional(readOnly = true)` + 변경 메서드에 `@Transactional` 재선언.

## 테스트 코드 컨벤션

### 철학
- **눈으로 보는 테스트**: `assertEquals` 같은 단언문 대신 `superLog()`로 결과를 출력하고 눈으로 확인한다.
- **통합 테스트 우선**: 실제 DB와 스프링 컨텍스트를 띄워서 진짜 동작을 검증한다.

### 구조 (필수 패턴)
```java
@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class XxxServiceTest {

    @Autowired XxxService xxxService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("테스트시작");

        lineLog(null);
        timeLog(this::케이스명_테스트);
        lineLog(null);

        lineLog("테스트종료");
    }

    public void 케이스명_테스트() {
        lineLog("케이스 설명");
        var result = xxxService.someMethod(...);
        superLog(result);   // 결과 출력 — 눈으로 확인
    }
}
```

### 규칙
- `@Test`는 `mainTest()` 하나만. 세부 케이스는 `timeLog(this::xxx_테스트)`로 위임한다.
- `@Transactional`은 `@Test`(= `mainTest()`) 에 선언한다. 세부 메서드에는 붙이지 않는다.
- 결과 출력은 `superLog(객체)` / 구분선은 `lineLog("설명")` 또는 `lineLog(null)` / 시간 측정은 `timeLog(this::메서드)`.
- `import static kr.suhsaechan.suhlogger.util.SuhLogger.*` 사용.
- 멀티모듈 프로젝트에서 `PassqlApplication`을 사용하려면 해당 모듈 `build.gradle`에 `testImplementation project(':PQL-Web')` 추가.
- 테스트 파일 위치: 대상 클래스와 동일한 패키지 구조로 `src/test/java/` 하위에 생성.

### assertThat 사용 여부
- 기본적으로 **사용하지 않는다**. `superLog()`로 출력하고 눈으로 확인하는 것이 이 프로젝트의 스타일.
- 단, NPE·예외 발생 여부처럼 눈으로 확인이 불가능한 경우에만 최소한으로 사용할 수 있다.

---

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
- [ ] Controller에서 Repository를 직접 주입하지 않았는가? (반드시 Service 경유)
- [ ] Controller에 `@Transactional`이 없는가? (Service 레이어에만 허용)
- [ ] Controller에 비즈니스 로직이 없는가? (3줄 이상 조건/변환 → Service로 추출)
- [ ] API 추가/변경 시 `docs/apilog/` 에 변경 내역을 기록했는가?
- [ ] 테스트 코드에 `assertThat` 대신 `superLog()`로 결과를 출력했는가?
- [ ] 테스트 `@Transactional`은 `mainTest()`에만 선언했는가? (세부 메서드에 중복 선언 금지)
- [ ] 멀티모듈 테스트에 `testImplementation project(':PQL-Web')`를 추가했는가?
- [ ] 도메인별 `XxxException` 클래스를 만들지 않았는가? (반드시 `CustomException(ErrorCode.XXX)` 사용)
- [ ] 새 에러 타입이 필요하면 `ErrorCode` enum에 추가했는가?

## 문제(Question) 관련 작업 시 추가 체크리스트

- [ ] stem에 SQL이 포함된 EXECUTABLE 문제는 ` ```sql ``` ` 코드 블록으로 SQL을 감쌌는가?
- [ ] stem/문제 형식 관련 규칙이 변경됐을 경우 아래 파일들도 함께 수정했는가?
  - `PQL-Web/src/main/resources/static/docs/question-single-guide.md` (단건 등록 가이드 MD)
  - `PQL-Web/src/main/resources/static/docs/question-bulk-guide.md` (대량 등록 가이드 MD)
  - `PQL-Web/src/main/resources/templates/admin/question-register.html` (단건 등록 가이드 모달)
  - `PQL-Web/src/main/resources/templates/admin/questions.html` (대량 등록 가이드 모달)
