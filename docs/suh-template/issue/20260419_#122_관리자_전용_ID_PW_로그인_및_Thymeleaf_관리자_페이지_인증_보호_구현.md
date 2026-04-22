# ➕[기능추가][Admin] 관리자 전용 ID/PW 로그인 및 관리자 페이지 인증 보호 구현

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- `/admin/**` 경로가 `SecurityConfig`에서 `permitAll()` 상태 — 인증 없이 누구나 접근 가능
- 일반 사용자 인증(Google OAuth → Firebase → JWT)과 관리자 인증 체계가 분리되어 있지 않음
- 관리자 페이지는 Thymeleaf 서버 렌더링(Spring MVC) 기반으로, JWT 방식과 구조적으로 맞지 않음
- Flutter/React 앱은 JWT를 사용하므로, 관리자 인증만 별도 세션 기반으로 분리 필요

🛠️해결 방안 / 제안 기능
---

**인증 구조 분리 원칙**
- 일반 사용자(React/Flutter): Google OAuth → Firebase idToken → JWT (기존 유지)
- 관리자(Thymeleaf `/admin/**`): ID/PW 폼 로그인 → Spring Security 세션 (신규)

**BE: SecurityConfig 수정**
- `/admin/login` → `permitAll()` (로그인 페이지 자체는 열어둠)
- `/admin/**` → `hasRole("ADMIN")` + Spring Security form login 설정 추가
- 관리자 세션과 JWT 필터가 충돌하지 않도록 분리 (filter chain 분리 또는 requestMatcher 조건 처리)

**BE: 관리자 계정 자격증명 저장**
- `Member` 테이블에 `admin_password` 컬럼 추가 (BCrypt 해시) 또는 별도 `admin_account` 테이블 검토
- ADMIN role 계정에 한해 ID/PW 로그인 허용
- 초기 관리자 계정은 Flyway seed 또는 환경변수로 주입

**BE: Thymeleaf 관리자 로그인 페이지**
- `GET /admin/login` — 로그인 폼 렌더링
- `POST /admin/login` — Spring Security `UsernamePasswordAuthenticationFilter` 처리
- 로그인 실패 시 에러 메시지 표시 (`?error` 파라미터)
- 로그인 성공 시 `/admin` 대시보드로 redirect
- 세션 만료/미인증 접근 시 `/admin/login`으로 redirect

**BE: AdminUserDetailsService 구현**
- `UserDetailsService` 구현체 — DB에서 ADMIN role 계정 조회
- Spring Security form login과 연동

🙋‍♂️담당자
---

- 
