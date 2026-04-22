# passQL OAuth + JWT 인증 설계

**작성일:** 2026-04-18  
**참고 프로젝트:** cops-and-robbers-BE (코드 스타일 기준)  
**적용 프로젝트:** passQL Spring 멀티모듈 서버

---

## 1. 개요

- 프론트에서 Firebase SDK로 소셜 로그인 후 받은 idToken을 백엔드로 전달
- 백엔드는 Firebase Admin SDK로 idToken 검증 → 자체 JWT(AccessToken + RefreshToken) 발급
- Spring Security Filter Chain에 `JwtAuthenticationFilter` 등록
- 관리자(ADMIN/SUPER_ADMIN)는 DB에서 직접 role 변경, 별도 가입 흐름 없음
- 익명 회원(`createAnonymous`) 및 `POST /api/members/register` 삭제 (하드리셋)

---

## 2. 인증 플로우

```
[프론트]                    [백엔드]                      [Firebase]
  │  Firebase SDK 소셜 로그인  │                             │
  │ ─────────────────────────>│                             │
  │  idToken 수신              │                             │
  │                           │                             │
  │  POST /api/auth/login      │                             │
  │  { idToken, authProvider } │                             │
  │ ─────────────────────────>│── verifyIdToken() ─────────>│
  │                           │<── FirebaseToken(uid) ──────│
  │                           │                             │
  │                           │ DB: uid + provider로 회원 조회
  │                           │ 없으면 signUp() 처리          │
  │                           │                             │
  │                           │ AccessToken + RefreshToken 발급
  │                           │ RefreshToken → Redis 저장    │
  │                           │                             │
  │  { accessToken,           │                             │
  │    refreshToken, isNew }  │                             │
  │ <─────────────────────────│                             │
  │                           │                             │
  │  이후 모든 보호 API           │                             │
  │  Authorization: Bearer {accessToken}                    │
  │ ─────────────────────────>│                             │
  │                           │ JwtAuthenticationFilter     │
  │                           │ → SecurityContext 설정       │
  │                           │ → Controller 진입            │
```

---

## 3. API 엔드포인트

| Method | Path | 설명 | 응답 |
|--------|------|------|------|
| POST | `/api/auth/login` | 소셜 로그인 / 신규가입 | 200 기존, 201 신규 |
| POST | `/api/auth/reissue` | RefreshToken → 새 AccessToken+RefreshToken | 200 |
| POST | `/api/auth/logout` | Redis RefreshToken 삭제 | 204 |

### LoginRequest
```json
{
  "authProvider": "GOOGLE",
  "idToken": "eyJhbGci..."
}
```

### LoginResponse
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "isNewMember": true,
  "memberUuid": "550e8400-e29b-41d4-a716-446655440000",
  "nickname": "빠른고양이123"
}
```

---

## 4. 모듈 구조 및 파일 배치

```
PQL-Web/
└── com.passql.web/
    ├── config/
    │   ├── SecurityConfig.java           # FilterChain + JwtAuthenticationFilter 등록
    │   └── FirebaseConfig.java           # FirebaseApp, FirebaseAuth Bean
    └── controller/
        └── AuthController.java           # POST /api/auth/{login, reissue, logout}

PQL-Domain-Member/
└── com.passql.member/
    └── auth/
        ├── application/
        │   ├── AuthService.java
        │   └── dto/
        │       ├── command/LoginCommand.java
        │       └── result/LoginResult.java
        ├── domain/
        │   └── Tokens.java
        ├── exception/
        │   └── AuthException.java        # ErrorCode 위임
        ├── infrastructure/
        │   ├── jwt/
        │   │   ├── JwtTokenProvider.java
        │   │   └── JwtProperties.java
        │   └── social/strategy/
        │       ├── SocialLoginStrategy.java          # 인터페이스
        │       ├── FirebaseLoginStrategy.java        # abstract — Firebase SDK 검증 (Google, Apple)
        │       ├── GoogleLoginStrategy.java          # Firebase 지원 → FirebaseLoginStrategy 상속
        │       ├── AppleLoginStrategy.java           # Firebase 지원 → FirebaseLoginStrategy 상속
        │       ├── KakaoLoginStrategy.java           # Firebase 미지원 → Kakao REST API 직접 검증
        │       ├── NaverLoginStrategy.java           # Firebase 미지원 → Naver REST API 직접 검증
        │       ├── GithubLoginStrategy.java          # Firebase 미지원 → Github REST API 직접 검증
        │       └── SocialLoginStrategyConfig.java
        ├── presentation/
        │   ├── dto/
        │   │   ├── request/LoginRequest.java
        │   │   ├── request/ReissueRequest.java
        │   │   ├── request/LogoutRequest.java
        │   │   ├── response/LoginResponse.java
        │   │   └── response/ReissueResponse.java
        │   └── annotation/
        │       └── AuthMember.java                   # 컨트롤러 파라미터 애너테이션
        └── repository/
            └── RefreshTokenRepository.java           # Redis 저장소

PQL-Common/
└── com.passql.common/
    └── security/
        ├── JwtAuthenticationFilter.java              # Security Filter
        ├── LoginMember.java                          # SecurityContext 객체 (UUID)
        └── LoginMemberArgumentResolver.java          # @AuthMember → LoginMember 주입
```

---

## 5. JWT 구조

### AccessToken
- subject: `memberUuid.toString()` (UUID 문자열)
- 추가 클레임: `role` (예: `"USER"`, `"ADMIN"`)
- 만료: 1시간
- 시크릿: 별도 Base64 키

### RefreshToken
- subject: `memberUuid.toString()`
- 만료: 14일
- 시크릿: AccessToken과 다른 별도 Base64 키
- 저장: Redis `refresh_token:{memberUuid}`

### application-dev.yml / application-prod.yml 설정
```yaml
jwt:
  access:
    secret: {base64-encoded-secret}
    expiration: 1h
  refresh:
    secret: {base64-encoded-secret}
    expiration: 14d

firebase:
  key-path: classpath:firebase-service-account-dev.json   # dev
  # key-path: /secrets/firebase-service-account.json      # prod (파일시스템)
```

---

## 6. Spring Security 설정

```
permitAll (인증 불필요):
  POST /api/auth/**
  GET  /actuator/health
  /admin/**               ← Thymeleaf 관리자 페이지 현행 유지
  /swagger-ui/**, /v3/api-docs/**

authenticated (인증 필요):
  /api/members/**
  기타 /api/**

hasRole('ADMIN') (관리자 필요):
  /api/admin/**           ← 향후 REST 관리자 API 추가 시
```

`JwtAuthenticationFilter`는 `UsernamePasswordAuthenticationFilter` 앞에 등록. 토큰 없거나 만료 시 `SecurityContext` 비우고 다음 필터로 진행 (401은 `authorizeHttpRequests`에서 처리).

---

## 7. Member 엔티티 변경

### 삭제
- `Member.createAnonymous()`
- `Member.createTestAccount()`

### 추가
```java
public static Member signUp(String providerUserId, AuthProvider authProvider,
                             String email, Boolean emailVerified, String nickname) { ... }
```

### 기존 필드 활용 (변경 없음)
- `providerUserId` — Firebase uid 저장
- `authProvider` — GOOGLE/KAKAO/NAVER/APPLE/GITHUB
- `role` — MemberRole.USER (기본), DB에서 ADMIN으로 변경 가능
- `email`, `emailVerified` — Firebase 토큰에서 추출

---

## 8. 삭제 대상 (하드리셋)

| 대상 | 위치 |
|------|------|
| `POST /api/members/register` | `MemberController` |
| `MemberService.register()` | `MemberService` |
| `Member.createAnonymous()` | `Member` |
| `Member.createTestAccount()` | `Member` |
| `AuthProvider.ANONYMOUS` | `AuthProvider` enum |

---

## 9. ErrorCode 추가 (PQL-Common)

```java
// Auth
EXPIRED_FIREBASE_TOKEN(HttpStatus.UNAUTHORIZED, "Firebase 토큰이 만료되었습니다."),
INVALID_FIREBASE_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 Firebase 토큰입니다."),
FIREBASE_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Firebase 서버 오류입니다."),
ACCESS_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "액세스 토큰이 만료되었습니다."),
REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "리프레시 토큰이 만료되었습니다."),
INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
UNAUTHENTICATED_REQUEST(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
UNSUPPORTED_AUTH_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 소셜 플랫폼입니다."),
```

---

## 10. Flyway 마이그레이션

버전 `V0_0_155__auth_cleanup.sql` (현재 버전 0.0.154 기준):
- `ANONYMOUS` authProvider 데이터 정리 (있을 경우)
- member 테이블 스키마 변경 없음 (필드 이미 완비)

---

## 11. 테스트 전략

cops-and-robbers-BE의 `FirebaseTestConfig` 패턴 참고:
- `@Profile("test")`에서 `FirebaseAuth` Mock Bean 등록
- `AuthServiceTest`: `superLog()`로 loginResult 출력, 신규/기존 회원 케이스
- `AuthControllerTest`: MockMvc + MockBean으로 `JwtAuthenticationFilter` 우회

---

## 12. 의존성 추가 (build.gradle)

```groovy
// PQL-Domain-Member/build.gradle
implementation 'com.google.firebase:firebase-admin:9.3.0'
implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'

// PQL-Web/build.gradle
implementation 'org.springframework.boot:spring-boot-starter-security'
```
