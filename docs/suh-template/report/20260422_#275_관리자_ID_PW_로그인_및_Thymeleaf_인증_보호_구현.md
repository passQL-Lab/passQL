# ⚙️[기능추가][인증] 관리자 ID/PW 로그인 및 Thymeleaf 인증 보호 구현

## 개요

Spring Security 이중 filter chain을 적용해 기존 JWT 기반 API 인증(`/api/**`)과 완전 분리된 세션 기반 관리자 로그인(`/admin/**`)을 구현했다. DB 없이 환경변수로 단일 관리자 계정을 관리하며, DaisyUI 5 + Tailwind CSS 4 기반 로그인 페이지와 로그아웃 버튼을 추가했다.

---

## 변경 사항

### 웹 레이어 (PQL-Web)

#### Security 설정
- `AdminSecurityConfig.java` (신규): 관리자 전용 filter chain (`@Order(1)`, `/admin/**` 매핑)
  - 세션 기반 폼 로그인 (`SessionCreationPolicy.IF_REQUIRED`)
  - 로그인 성공 시 `/admin` 리다이렉트, 실패 시 `/admin/login?error=true`
  - 로그아웃 시 세션 무효화 + `JSESSIONID` 쿠키 삭제
  - `BCryptPasswordEncoder` Bean 등록
- `SecurityConfig.java` (수정): `@Order(2)` 추가, `securityMatcher("/api/**", "/actuator/**", "/swagger-ui/**", "/v3/api-docs/**")` 로 범위 명시 — admin chain과의 충돌 방지

#### 관리자 계정 인증
- `AdminUserDetailsService.java` (신규): `UserDetailsService` 구현, DB 조회 없이 `@Value("${admin.username}")` / `@Value("${admin.password-hash}")` 로 단일 계정 인증

#### 컨트롤러 / 템플릿
- `AdminLoginController.java` (신규): `GET /admin/login` — `error` / `logout` 파라미터에 따라 에러/로그아웃 메시지 Model 바인딩
- `templates/admin/login.html` (신규): 독립 로그인 페이지, 로고 + "관리자 로그인" 문구, CSRF 토큰, 에러/로그아웃 알림
- `templates/admin/layout.html` (수정): navbar에 CSRF 포함 로그아웃 form 버튼 추가

#### 설정 (application yml)
- `application.yml`: `admin.username` / `admin.password-hash` 환경변수 바인딩 추가
- `application-dev.yml` / `application-prod.yml`: 기본 계정 설정 (아이디/비밀번호 BCrypt 해시, gitignore 대상)

---

## 주요 구현 내용

**이중 filter chain 분리**: `AdminSecurityConfig(@Order(1))`는 `/admin/**`만 처리하고, `SecurityConfig(@Order(2))`는 `/api/**` 등 나머지를 처리한다. `securityMatcher`로 각 chain의 적용 범위를 명시적으로 분리해 JWT 체인이 admin 요청에 간섭하거나 admin 체인이 API 요청에 영향을 주지 않는다.

**환경변수 기반 단일 계정**: DB 테이블 없이 yml 설정값으로 관리자 계정을 관리한다. 운영 환경에서는 환경변수(`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`)로 주입하며, 비밀번호는 BCrypt 해시만 저장한다.

**CSRF 보호**: Thymeleaf 폼 로그인과 로그아웃 모두 Spring Security의 CSRF 토큰을 포함한다. `th:if="${_csrf}"` 조건으로 CSRF 비활성화 환경과의 호환성도 유지한다.

---

## 주의사항

- **기본 비밀번호 변경 권고**: `application-prod.yml`의 기본 비밀번호 해시는 개발 편의용이다. 운영 배포 전 반드시 환경변수(`ADMIN_PASSWORD_HASH`)로 더 강한 비밀번호의 BCrypt 해시를 주입할 것
- **`application-dev.yml` / `application-prod.yml` gitignore**: 두 파일은 `.gitignore` 대상이므로 서버 환경에 직접 복사 또는 환경변수로 관리해야 한다
- **`PasswordEncoder` Bean 충돌 주의**: `AdminSecurityConfig`에 `BCryptPasswordEncoder` Bean이 등록돼 있다. 추후 다른 모듈에서 `PasswordEncoder` Bean을 추가 등록하면 충돌 발생 가능 — `@Qualifier`로 구분 필요
