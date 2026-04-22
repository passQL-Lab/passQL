---
제목: ⚙️[기능추가][인증] 관리자 ID/PW 로그인 및 Thymeleaf 관리자 페이지 인증 보호 구현
라벨: 작업전
---

# ⚙️[기능추가][인증] 관리자 ID/PW 로그인 및 Thymeleaf 관리자 페이지 인증 보호 구현

📝 현재 문제점
---

- `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java`에서 `/admin/**`이 `permitAll()` 상태로 완전히 개방되어 있음
- Thymeleaf 기반 관리자 페이지(`/admin/**`)에 인증 없이 누구나 접근 가능한 상태
- 현재 SecurityConfig는 JWT 기반 무상태(Stateless) 세션으로 설정되어 있어, 관리자 폼 로그인을 위한 별도 세션 기반 filter chain이 필요함
- Member 엔티티에 관리자 ID/PW 저장을 위한 컬럼이 없음

🛠️ 해결 방안 / 제안 기능
---

- Spring Security의 `securityMatcher`를 이용해 `/admin/**` 전용 filter chain을 별도로 분리
  - 일반 사용자(앱): JWT 무상태 filter chain (`/api/**`)
  - 관리자(Thymeleaf): ID/PW 폼 로그인 + 세션 기반 filter chain (`/admin/**`)
  - 두 filter chain이 충돌하지 않도록 `@Order`로 우선순위 분리
- 관리자 계정 저장 방식: `member` 테이블의 `role = ADMIN` 행에 `admin_password` 컬럼 추가 (BCrypt 해시 저장), 또는 별도 `admin_account` 테이블 신설
- `AdminUserDetailsService` 구현 — `UserDetailsService` 상속, `loadUserByUsername`으로 admin 계정 조회
- `GET/POST /admin/login` — Thymeleaf 로그인 폼 추가 (기존 관리자 페이지 스타일 준수)
- 로그인 성공 시 `/admin/dashboard`로 redirect, 실패 시 `/admin/login?error=true` redirect
- 로그아웃: `POST /admin/logout` → 세션 무효화 후 `/admin/login`으로 redirect
- Flyway 마이그레이션으로 admin_password 컬럼 또는 admin_account 테이블 추가

⚙️ 작업 내용
---

- [ ] Flyway 마이그레이션 — admin 인증 관련 스키마 변경 (admin_password 컬럼 또는 admin_account 테이블)
- [ ] `AdminUserDetailsService.java` 구현 (`PQL-Domain-Member` 또는 `PQL-Web` 모듈)
- [ ] `SecurityConfig.java` — `/admin/**` 전용 세션 기반 filter chain 분리 (`@Order(1)`), 기존 JWT chain은 `@Order(2)`
- [ ] `GET /admin/login` — Thymeleaf 로그인 폼 컨트롤러 + 템플릿
- [ ] `POST /admin/logout` — 세션 무효화 처리
- [ ] 기존 `/admin/**` 경로 전체에 `hasRole("ADMIN")` 또는 `hasRole("SUPER_ADMIN")` 인증 적용
- [ ] 초기 admin 계정 생성 — Flyway seed 또는 application 시작 시 `CommandLineRunner`로 기본 계정 생성

🙋‍♂️ 담당자
---

- 백엔드: suhsaechan
