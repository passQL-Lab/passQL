# 관리자 ID/PW 로그인 및 Thymeleaf 인증 보호 설계

이슈: https://github.com/passQL-Lab/passQL/issues/275

## 배경

현재 `/admin/**` 경로가 `SecurityConfig`에서 `permitAll()`로 개방되어 있어 누구나 접근 가능한 상태다. 일반 사용자(React)는 JWT 무상태 인증을 사용하고, 관리자(Thymeleaf)는 세션 기반 폼 로그인으로 분리 구현한다.

## 핵심 결정사항

| 항목 | 결정 |
|------|------|
| 관리자 계정 저장 | 환경변수 (`application-dev.yml`, `application-prod.yml`) |
| 인증 방식 | Spring Security 세션 기반 폼 로그인 |
| DB 스키마 변경 | 없음 (Flyway 마이그레이션 불필요) |
| 로그아웃 | `/admin/login?logout=true` redirect + 메시지 표시 |
| 다중 계정 | 미지원 (단일 계정으로 충분) |

## 아키텍처

### Filter Chain 분리

Spring Security `securityMatcher`로 두 filter chain을 완전 독립 운영한다. 서로 간섭 없음.

```
SecurityConfig
├── adminFilterChain()  @Order(1)
│   ├── securityMatcher("/admin/**")
│   ├── SessionCreationPolicy.IF_REQUIRED
│   ├── formLogin: loginPage("/admin/login"), loginProcessingUrl("/admin/login")
│   ├── logout: logoutUrl("/admin/logout"), logoutSuccessUrl("/admin/login?logout=true")
│   └── AdminUserDetailsService (환경변수 기반)
│
└── apiFilterChain()  @Order(2)  ← 기존 코드 변경 없음
    ├── securityMatcher("/api/**")
    ├── SessionCreationPolicy.STATELESS
    └── JwtAuthenticationFilter
```

### 인증 흐름

```
브라우저 → GET /admin/login
         ← login.html (폼)

브라우저 → POST /admin/login (username, password)
         → AdminUserDetailsService.loadUserByUsername()
           → 환경변수 ADMIN_USERNAME 비교
           → BCrypt 검증 (ADMIN_PASSWORD_HASH)
         ← 성공: /admin/dashboard redirect + JSESSIONID 쿠키 발급
         ← 실패: /admin/login?error=true redirect

브라우저 → GET /admin/dashboard (JSESSIONID 포함)
         → Spring Security 세션 검증
         ← dashboard.html 렌더링

브라우저 → POST /admin/logout
         → 세션 무효화
         ← /admin/login?logout=true redirect
```

## 환경변수 설정

`application-dev.yml` 및 `application-prod.yml`에 아래 블록 추가:

```yaml
admin:
  username: admin
  password-hash: "{bcrypt}$2a$10$..."  # BCrypt 해시값
```

- `password-hash`에는 평문이 아닌 **BCrypt 해시값**을 입력한다
- 해시 생성: `htpasswd -bnBC 10 "" plainPassword | tr -d ':\n'` 또는 온라인 BCrypt 생성기 사용
- `AdminUserDetailsService`가 `@Value`로 두 값을 읽어 `UserDetails`를 구성한다

## 신규 파일

### 1. `AdminUserDetailsService.java`

위치: `server/PQL-Web/src/main/java/com/passql/web/config/admin/AdminUserDetailsService.java`

- `UserDetailsService` 구현
- `@Value("${admin.username}")`, `@Value("${admin.password-hash}")` 주입
- `loadUserByUsername()`에서 username 불일치 시 `UsernameNotFoundException` throw
- 일치 시 `User.withUsername().password().roles("ADMIN").build()` 반환

### 2. `AdminSecurityConfig.java` (또는 SecurityConfig 내 @Bean 추가)

위치: `server/PQL-Web/src/main/java/com/passql/web/config/AdminSecurityConfig.java`

- `@Order(1)` 적용
- `securityMatcher("/admin/**")`
- `formLogin().loginPage("/admin/login").loginProcessingUrl("/admin/login").defaultSuccessUrl("/admin/dashboard", true).failureUrl("/admin/login?error=true")`
- `logout().logoutUrl("/admin/logout").logoutSuccessUrl("/admin/login?logout=true").invalidateHttpSession(true).deleteCookies("JSESSIONID")`
- `BCryptPasswordEncoder` @Bean 등록
- 기존 `SecurityConfig`에 `@Order(2)` 추가, `securityMatcher("/api/**")` 추가

### 3. `AdminLoginController.java`

위치: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminLoginController.java`

- `GET /admin/login` — `login.html` 렌더링 (query param `error`, `logout` 수신하여 Model에 추가)
- Spring Security가 `POST /admin/login`을 직접 처리하므로 POST 핸들러 불필요

### 4. `admin/login.html`

위치: `server/PQL-Web/src/main/resources/templates/admin/login.html`

- 기존 `layout.html` 미사용 — 독립 페이지 (로그인 전이므로 네비게이션 불필요)
- 기존 관리자 페이지 디자인 시스템 준수 (DaisyUI 5 + Tailwind CSS 4)
- 에러 메시지: `?error` 파라미터 있을 때 "아이디 또는 비밀번호가 올바르지 않습니다" 표시
- 로그아웃 메시지: `?logout` 파라미터 있을 때 "로그아웃 되었습니다" 표시

## 수정 파일

### `SecurityConfig.java`

- 기존 `filterChain()` 메서드에 `@Order(2)` 추가
- `securityMatcher("/api/**")` 추가 — admin 경로가 이 chain에 걸리지 않도록 분리
- `/admin/**` permitAll 줄 제거

## 변경 없는 것

- DB 스키마 (Flyway 마이그레이션 없음)
- Member 엔티티
- JWT 인증 흐름 (React/Flutter 앱)
- 기존 관리자 컨트롤러 18개 — 경로 유지, 인증은 filter chain이 처리
- 기존 Thymeleaf 템플릿 — layout.html 포함 수정 없음

## 성공 기준

- [ ] `/admin/login` 미인증 접근 시 로그인 폼으로 redirect
- [ ] 올바른 ID/PW 입력 시 `/admin/dashboard` 진입
- [ ] 틀린 ID/PW 입력 시 에러 메시지 표시
- [ ] 로그아웃 후 `/admin/login?logout=true` redirect + 메시지
- [ ] `/api/**` JWT 인증 기존 동작 유지 (회귀 없음)
- [ ] 브라우저 세션 만료 후 `/admin/login`으로 자동 redirect
