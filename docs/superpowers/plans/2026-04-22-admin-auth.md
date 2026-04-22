# 관리자 ID/PW 로그인 및 Thymeleaf 인증 보호 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/**` 경로를 세션 기반 폼 로그인으로 보호하고, 환경변수로 관리자 단일 계정을 관리한다.

**Architecture:** Spring Security `securityMatcher`로 `/admin/**` 전용 filter chain(@Order(1))과 기존 JWT chain(@Order(2))을 완전 분리한다. 관리자 계정은 `application-dev.yml` / `application-prod.yml`의 `admin.username`, `admin.password-hash` 값을 `AdminUserDetailsService`가 읽어 BCrypt로 검증한다.

**Tech Stack:** Spring Boot 3.4.4, Spring Security 6, Thymeleaf + Layout Dialect, DaisyUI 5, Tailwind CSS 4, BCrypt

---

## 파일 맵

| 작업 | 파일 | 변경 |
|------|------|------|
| Task 1 | `server/PQL-Web/src/main/resources/application.yml` | 수정 |
| Task 2 | `server/PQL-Web/src/main/java/com/passql/web/config/AdminSecurityConfig.java` | 신규 |
| Task 2 | `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java` | 수정 |
| Task 3 | `server/PQL-Web/src/main/java/com/passql/web/config/admin/AdminUserDetailsService.java` | 신규 |
| Task 4 | `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminLoginController.java` | 신규 |
| Task 5 | `server/PQL-Web/src/main/resources/templates/admin/login.html` | 신규 |

---

### Task 1: yml 환경변수 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/application.yml`

> `application-dev.yml`, `application-prod.yml`은 `.gitignore` 대상이므로 로컬/서버에 직접 추가해야 한다. 이 태스크는 공통 yml에 플레이스홀더를 추가하고, 각 환경 파일에 실제 값을 작성하는 방법을 명시한다.

- [ ] **Step 1: `application.yml`에 admin 섹션 추가**

`server/PQL-Web/src/main/resources/application.yml` 파일 하단에 추가:

```yaml
admin:
  username: ${ADMIN_USERNAME:admin}
  password-hash: ${ADMIN_PASSWORD_HASH:}
```

- [ ] **Step 2: `application-dev.yml` 로컬 파일에 값 추가**

`server/PQL-Web/src/main/resources/application-dev.yml` (로컬에만 존재, git 제외)에 추가:

```yaml
admin:
  username: admin
  password-hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
  # 위 해시는 평문 "admin1234" 의 BCrypt 해시 (테스트용)
  # 실제 해시 생성: https://bcrypt-generator.com 또는
  # htpasswd -bnBC 10 "" yourpassword | tr -d ':\n'
```

- [ ] **Step 3: `application-prod.yml` 서버 파일에 값 추가**

운영 서버의 `application-prod.yml`에 추가 (실제 강한 패스워드의 BCrypt 해시 사용):

```yaml
admin:
  username: admin
  password-hash: "$2a$10$실제운영해시값"
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/resources/application.yml
git commit -m "⚙️[기능추가][인증] 관리자 인증 yml 설정 추가 #275"
```

---

### Task 2: AdminSecurityConfig 신규 생성 + SecurityConfig 수정

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/config/AdminSecurityConfig.java`
- Modify: `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java`

- [ ] **Step 1: `AdminSecurityConfig.java` 생성**

```java
package com.passql.web.config;

import com.passql.web.config.admin.AdminUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@RequiredArgsConstructor
public class AdminSecurityConfig {

    private final AdminUserDetailsService adminUserDetailsService;

    @Bean
    @Order(1)
    public SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/admin/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/login").permitAll()
                .anyRequest().hasRole("ADMIN")
            )
            .formLogin(form -> form
                .loginPage("/admin/login")
                .loginProcessingUrl("/admin/login")
                .defaultSuccessUrl("/admin/dashboard", true)
                .failureUrl("/admin/login?error=true")
                .usernameParameter("username")
                .passwordParameter("password")
            )
            .logout(logout -> logout
                .logoutUrl("/admin/logout")
                .logoutSuccessUrl("/admin/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .userDetailsService(adminUserDetailsService);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 2: `SecurityConfig.java` 수정 — `@Order(2)` + `securityMatcher` 추가, `/admin/**` permitAll 제거**

```java
package com.passql.web.config;

import com.passql.member.auth.presentation.security.JwtAuthenticationFilter;
import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    @Order(2)
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**", "/actuator/**", "/swagger-ui/**", "/v3/api-docs/**")
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/config/AdminSecurityConfig.java
git add server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java
git commit -m "⚙️[기능추가][인증] admin filter chain 분리 및 SecurityConfig @Order 적용 #275"
```

---

### Task 3: AdminUserDetailsService 구현

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/config/admin/AdminUserDetailsService.java`

- [ ] **Step 1: `AdminUserDetailsService.java` 생성**

```java
package com.passql.web.config.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 환경변수 기반 단일 관리자 계정 인증.
 * DB 조회 없이 yml 설정값으로 UserDetails를 구성한다.
 */
@Service
public class AdminUserDetailsService implements UserDetailsService {

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password-hash}")
    private String adminPasswordHash;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (!adminUsername.equals(username)) {
            throw new UsernameNotFoundException("관리자 계정을 찾을 수 없습니다: " + username);
        }
        return User.withUsername(adminUsername)
                .password(adminPasswordHash)
                .roles("ADMIN")
                .build();
    }
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/config/admin/AdminUserDetailsService.java
git commit -m "⚙️[기능추가][인증] AdminUserDetailsService 환경변수 기반 구현 #275"
```

---

### Task 4: AdminLoginController 구현

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminLoginController.java`

- [ ] **Step 1: `AdminLoginController.java` 생성**

```java
package com.passql.web.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * 관리자 로그인 페이지 컨트롤러.
 * POST /admin/login 은 Spring Security formLogin이 직접 처리한다.
 */
@Controller
@RequestMapping("/admin/login")
public class AdminLoginController {

    @GetMapping
    public String loginPage(
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "logout", required = false) String logout,
            Model model
    ) {
        if (error != null) {
            model.addAttribute("errorMessage", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if (logout != null) {
            model.addAttribute("logoutMessage", "로그아웃 되었습니다.");
        }
        return "admin/login";
    }
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminLoginController.java
git commit -m "⚙️[기능추가][인증] AdminLoginController 구현 #275"
```

---

### Task 5: 로그인 페이지 Thymeleaf 템플릿

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/login.html`

- [ ] **Step 1: `admin/login.html` 생성**

기존 layout.html과 동일한 CDN(DaisyUI 5, Tailwind CSS 4, Lucide)을 사용하되, 네비게이션 없는 독립 페이지로 작성한다.

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" data-theme="light">
<head>
    <meta charset="utf-8"/>
    <title>passQL Admin | 로그인</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link rel="icon" type="image/x-icon" th:href="@{/favicon.ico}"/>
    <link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css"/>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="min-h-screen bg-base-200 flex items-center justify-center">

<div class="card w-full max-w-sm bg-base-100 shadow-md">
    <div class="card-body gap-4">

        <!-- 헤더 -->
        <div class="text-center">
            <h1 class="text-2xl font-bold">passQL Admin</h1>
            <p class="text-base-content/60 text-sm mt-1">관리자 로그인</p>
        </div>

        <!-- 로그아웃 메시지 -->
        <div th:if="${logoutMessage}" class="alert alert-success">
            <i data-lucide="check-circle" class="size-4"></i>
            <span th:text="${logoutMessage}"></span>
        </div>

        <!-- 에러 메시지 -->
        <div th:if="${errorMessage}" class="alert alert-error">
            <i data-lucide="alert-circle" class="size-4"></i>
            <span th:text="${errorMessage}"></span>
        </div>

        <!-- 로그인 폼 -->
        <form th:action="@{/admin/login}" method="post" class="flex flex-col gap-3">
            <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}" th:if="${_csrf}"/>

            <label class="form-control">
                <div class="label">
                    <span class="label-text font-medium">아이디</span>
                </div>
                <input type="text" name="username" placeholder="관리자 아이디"
                       class="input input-bordered w-full" required autofocus/>
            </label>

            <label class="form-control">
                <div class="label">
                    <span class="label-text font-medium">비밀번호</span>
                </div>
                <input type="password" name="password" placeholder="비밀번호"
                       class="input input-bordered w-full" required/>
            </label>

            <button type="submit" class="btn btn-primary w-full mt-2">
                <i data-lucide="log-in" class="size-4"></i>
                로그인
            </button>
        </form>

    </div>
</div>

<script>lucide.createIcons();</script>
</body>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/login.html
git commit -m "⚙️[기능추가][인증] 관리자 로그인 Thymeleaf 템플릿 추가 #275"
```

---

### Task 6: 로그아웃 버튼 layout.html 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/layout.html`

- [ ] **Step 1: layout.html navbar 우측에 로그아웃 버튼 추가**

현재 navbar 우측(다크모드 토글 옆)에 로그아웃 폼 버튼을 추가한다.

`layout.html`의 `<!-- Right side -->` 블록을 찾아 아래와 같이 수정:

```html
<!-- Right side -->
<div class="flex-none flex items-center gap-2">
    <!-- Dark mode toggle -->
    <label class="swap swap-rotate btn btn-ghost btn-circle">
        <input type="checkbox" id="themeToggle"/>
        <i data-lucide="sun" class="swap-off size-5"></i>
        <i data-lucide="moon" class="swap-on size-5"></i>
    </label>

    <!-- 로그아웃 -->
    <form th:action="@{/admin/logout}" method="post">
        <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}" th:if="${_csrf}"/>
        <button type="submit" class="btn btn-ghost btn-sm gap-1">
            <i data-lucide="log-out" class="size-4"></i>
            <span class="hidden sm:inline">로그아웃</span>
        </button>
    </form>
</div>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/layout.html
git commit -m "⚙️[기능추가][인증] 관리자 레이아웃 로그아웃 버튼 추가 #275"
```

---

### Task 7: 빌드 검증

- [ ] **Step 1: 서버 빌드**

```bash
cd server
./gradlew :PQL-Web:build -x test
```

예상 출력: `BUILD SUCCESSFUL`

빌드 실패 시 주요 원인:
- `AdminUserDetailsService` 빈 충돌 → `AdminSecurityConfig`의 `userDetailsService()` 호출 확인
- `PasswordEncoder` 빈 중복 → `SecurityConfig`에 `PasswordEncoder` 빈이 이미 있는지 확인 후 제거

- [ ] **Step 2: 로컬 서버 기동 후 수동 검증**

```bash
cd server
./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```

검증 체크리스트:
- `http://localhost:8080/admin` 접근 → `/admin/login`으로 redirect 확인
- `http://localhost:8080/admin/login` → 로그인 폼 렌더링 확인
- 틀린 비밀번호 입력 → "아이디 또는 비밀번호가 올바르지 않습니다." 메시지 확인
- 올바른 ID/PW 입력 → `/admin/dashboard` 진입 확인
- 로그아웃 버튼 클릭 → `/admin/login?logout=true` + "로그아웃 되었습니다." 확인
- `http://localhost:8080/api/auth/login` (POST) → 기존 JWT 인증 동작 유지 확인

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "⚙️[기능추가][인증] 관리자 ID/PW 로그인 및 Thymeleaf 인증 보호 구현 완료 #275"
```
