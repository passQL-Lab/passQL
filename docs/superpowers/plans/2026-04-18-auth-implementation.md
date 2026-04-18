# OAuth + JWT 인증 시스템 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Firebase Admin SDK 기반 OAuth 로그인(5개 provider) + Spring Security JwtAuthenticationFilter로 passQL 전체 인증 체계를 구축한다.

**Architecture:** 프론트에서 Firebase idToken을 전달하면 백엔드가 Firebase Admin SDK로 검증 후 자체 JWT(AccessToken 1h + RefreshToken 14d)를 발급한다. Spring Security Filter Chain에 JwtAuthenticationFilter를 등록하고, MemberRole 기반 경로 권한 분리를 적용한다. cops-and-robbers-BE의 레이어 구조/네이밍을 기준으로 하되 passQL 멀티모듈 규칙(UUID PK, CustomException, CLAUDE.md)을 따른다.

**Tech Stack:** Spring Boot 3.4.4, Spring Security, Firebase Admin SDK 9.3.0, jjwt 0.11.5, Redis(Lettuce), Java 21, Gradle 멀티모듈

---

## 파일 구조 맵

### 신규 생성

| 파일 | 모듈 | 책임 |
|------|------|------|
| `PQL-Common/.../security/JwtAuthenticationFilter.java` | PQL-Common | Security Filter, 토큰 파싱 → SecurityContext 설정 |
| `PQL-Common/.../security/LoginMember.java` | PQL-Common | SecurityContext에 담기는 인증 객체 (UUID + role) |
| `PQL-Common/.../security/LoginMemberArgumentResolver.java` | PQL-Common | @AuthMember → LoginMember 컨트롤러 파라미터 주입 |
| `PQL-Web/.../config/FirebaseConfig.java` | PQL-Web | FirebaseApp, FirebaseAuth Bean 등록 |
| `PQL-Web/.../controller/AuthController.java` | PQL-Web | POST /api/auth/{login,reissue,logout} |
| `PQL-Domain-Member/.../auth/domain/Tokens.java` | PQL-Domain-Member | AccessToken + RefreshToken 값 객체 |
| `PQL-Domain-Member/.../auth/infrastructure/jwt/JwtProperties.java` | PQL-Domain-Member | JWT 설정값 바인딩 |
| `PQL-Domain-Member/.../auth/infrastructure/jwt/JwtTokenProvider.java` | PQL-Domain-Member | JWT 발급/검증 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/SocialLoginStrategy.java` | PQL-Domain-Member | 전략 인터페이스 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/FirebaseLoginStrategy.java` | PQL-Domain-Member | Firebase SDK 검증 추상 클래스 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/GoogleLoginStrategy.java` | PQL-Domain-Member | Google (Firebase 상속) |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/AppleLoginStrategy.java` | PQL-Domain-Member | Apple (Firebase 상속) |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/KakaoLoginStrategy.java` | PQL-Domain-Member | Kakao REST API 직접 검증 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/NaverLoginStrategy.java` | PQL-Domain-Member | Naver REST API 직접 검증 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/GithubLoginStrategy.java` | PQL-Domain-Member | Github REST API 직접 검증 |
| `PQL-Domain-Member/.../auth/infrastructure/social/strategy/SocialLoginStrategyConfig.java` | PQL-Domain-Member | Map<AuthProvider, SocialLoginStrategy> Bean |
| `PQL-Domain-Member/.../auth/repository/RefreshTokenRepository.java` | PQL-Domain-Member | Redis refresh_token:{memberUuid} |
| `PQL-Domain-Member/.../auth/application/AuthService.java` | PQL-Domain-Member | 로그인/재발급/로그아웃 비즈니스 로직 |
| `PQL-Domain-Member/.../auth/application/dto/command/LoginCommand.java` | PQL-Domain-Member | AuthService 입력 커맨드 |
| `PQL-Domain-Member/.../auth/application/dto/result/LoginResult.java` | PQL-Domain-Member | AuthService 출력 결과 |
| `PQL-Domain-Member/.../auth/presentation/annotation/AuthMember.java` | PQL-Domain-Member | 컨트롤러 파라미터 애너테이션 |
| `PQL-Domain-Member/.../auth/presentation/dto/request/LoginRequest.java` | PQL-Domain-Member | 로그인 요청 DTO |
| `PQL-Domain-Member/.../auth/presentation/dto/request/ReissueRequest.java` | PQL-Domain-Member | 재발급 요청 DTO |
| `PQL-Domain-Member/.../auth/presentation/dto/request/LogoutRequest.java` | PQL-Domain-Member | 로그아웃 요청 DTO |
| `PQL-Domain-Member/.../auth/presentation/dto/response/LoginResponse.java` | PQL-Domain-Member | 로그인 응답 DTO |
| `PQL-Domain-Member/.../auth/presentation/dto/response/ReissueResponse.java` | PQL-Domain-Member | 재발급 응답 DTO |

### 수정

| 파일 | 변경 내용 |
|------|-----------|
| `PQL-Common/.../exception/constant/ErrorCode.java` | Auth 에러코드 8개 추가 |
| `PQL-Web/.../config/SecurityConfig.java` | JwtAuthenticationFilter 등록, 경로 권한 설정 |
| `PQL-Web/.../config/WebMvcConfig.java` | LoginMemberArgumentResolver 등록 |
| `PQL-Domain-Member/.../entity/Member.java` | signUp() 추가, createAnonymous()/createTestAccount() 삭제 |
| `PQL-Domain-Member/.../constant/AuthProvider.java` | ANONYMOUS 삭제 |
| `PQL-Domain-Member/build.gradle` | firebase-admin, jjwt 의존성 추가 |
| `PQL-Web/src/main/resources/application-dev.yml` | jwt, firebase 설정 추가 |
| `PQL-Web/src/main/resources/application-prod.yml` | jwt, firebase 설정 추가 |
| `PQL-Web/.../controller/MemberController.java` | register() 삭제, getMe/@AuthMember 전환 |
| `PQL-Domain-Member/.../service/MemberService.java` | register() 삭제, getMe(UUID) → getMe(LoginMember) 시그니처 변경 |

### 신규 마이그레이션

| 파일 | 내용 |
|------|------|
| `V0_0_155__auth_cleanup.sql` | ANONYMOUS authProvider 데이터 정리 |

---

## Task 1: ErrorCode에 Auth 에러코드 추가

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: ErrorCode에 Auth 카테고리 추가**

`// Member` 블록 아래에 다음을 추가한다:

```java
// Auth
EXPIRED_FIREBASE_TOKEN(HttpStatus.UNAUTHORIZED, "Firebase 토큰이 만료되었습니다."),
INVALID_FIREBASE_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 Firebase 토큰입니다."),
FIREBASE_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Firebase 서버 오류가 발생했습니다."),
ACCESS_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "액세스 토큰이 만료되었습니다."),
REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "리프레시 토큰이 만료되었습니다."),
INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
UNAUTHENTICATED_REQUEST(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
UNSUPPORTED_AUTH_PROVIDER(HttpStatus.BAD_REQUEST, "지원하지 않는 소셜 플랫폼입니다."),
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : Auth 에러코드 추가 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 2: 의존성 추가 (PQL-Domain-Member)

**Files:**
- Modify: `server/PQL-Domain-Member/build.gradle`

- [ ] **Step 1: firebase-admin, jjwt 의존성 추가**

```groovy
dependencies {
    api project(':PQL-Common')
    api 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'me.suhsaechan:suh-random-engine:1.1.0'

    // Firebase Admin SDK
    implementation 'com.google.firebase:firebase-admin:9.3.0'

    // JWT
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Member:build -x test
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/build.gradle
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : Firebase Admin SDK, jjwt 의존성 추가 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 3: Member 엔티티 하드리셋 및 signUp() 추가

**Files:**
- Modify: `server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java`
- Modify: `server/PQL-Domain-Member/src/main/java/com/passql/member/constant/AuthProvider.java`

- [ ] **Step 1: AuthProvider에서 ANONYMOUS 제거**

```java
public enum AuthProvider {
    GOOGLE,
    KAKAO,
    NAVER,
    APPLE,
    GITHUB
}
```

- [ ] **Step 2: Member.java — createAnonymous(), createTestAccount() 삭제 후 signUp() 추가**

`createAnonymous()`, `createTestAccount()` 정적 팩토리 메서드를 삭제하고 아래를 추가한다:

```java
/** OAuth 소셜 로그인 신규 가입. */
public static Member signUp(String providerUserId, AuthProvider authProvider,
                             String email, Boolean emailVerified, String nickname) {
    Member m = new Member();
    m.nickname = nickname;
    m.role = MemberRole.USER;
    m.status = MemberStatus.ACTIVE;
    m.authProvider = authProvider;
    m.providerUserId = providerUserId;
    m.email = email;
    m.emailVerified = emailVerified != null ? emailVerified : false;
    m.isTestAccount = false;
    m.lastSeenAt = LocalDateTime.now();
    return m;
}
```

- [ ] **Step 3: 빌드 확인 (컴파일 에러 없는지)**

```bash
cd server && ./gradlew :PQL-Domain-Member:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : Member signUp() 추가, ANONYMOUS 삭제 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 4: JWT 인프라 구성 (JwtProperties, JwtTokenProvider)

**Files:**
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/jwt/JwtProperties.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/jwt/JwtTokenProvider.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/domain/Tokens.java`

- [ ] **Step 1: Tokens.java 생성**

```java
package com.passql.member.auth.domain;

public record Tokens(String accessToken, String refreshToken) {}
```

- [ ] **Step 2: JwtProperties.java 생성**

```java
package com.passql.member.auth.infrastructure.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(TokenConfig access, TokenConfig refresh) {

    public record TokenConfig(String secret, Duration expiration) {}
}
```

- [ ] **Step 3: JwtTokenProvider.java 생성**

```java
package com.passql.member.auth.infrastructure.jwt;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.MemberRole;
import com.passql.member.entity.Member;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";

    private final JwtProperties jwtProperties;
    private final Key accessKey;
    private final Key refreshKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.accessKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.access().secret()));
        this.refreshKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.refresh().secret()));
    }

    public String createAccessToken(Member member) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.access().expiration().toMillis());
        return Jwts.builder()
                .setSubject(member.getMemberUuid().toString())
                .claim(CLAIM_ROLE, member.getRole().name())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(accessKey)
                .compact();
    }

    public String createRefreshToken(Member member) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.refresh().expiration().toMillis());
        return Jwts.builder()
                .setSubject(member.getMemberUuid().toString())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(refreshKey)
                .compact();
    }

    public UUID getMemberUuidFromAccessToken(String token) {
        return UUID.fromString(getAccessClaims(token).getSubject());
    }

    public MemberRole getRoleFromAccessToken(String token) {
        return MemberRole.valueOf(getAccessClaims(token).get(CLAIM_ROLE, String.class));
    }

    public UUID getMemberUuidFromRefreshToken(String token) {
        return UUID.fromString(getRefreshClaims(token).getSubject());
    }

    public Optional<UUID> getMemberUuidFromRefreshTokenSilently(String token) {
        try {
            return Optional.of(UUID.fromString(
                    Jwts.parserBuilder().setSigningKey(refreshKey).build()
                            .parseClaimsJws(token).getBody().getSubject()));
        } catch (ExpiredJwtException e) {
            // 만료된 토큰도 subject는 파싱 가능
            return Optional.of(UUID.fromString(e.getClaims().getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getRefreshTokenExpirationMillis() {
        return jwtProperties.refresh().expiration().toMillis();
    }

    private Claims getAccessClaims(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(accessKey).build()
                    .parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.ACCESS_TOKEN_EXPIRED);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.UNAUTHENTICATED_REQUEST);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    private Claims getRefreshClaims(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(refreshKey).build()
                    .parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.UNAUTHENTICATED_REQUEST);
        } catch (JwtException e) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }
}
```

- [ ] **Step 4: @EnableConfigurationProperties 등록**

`server/PQL-Web/src/main/java/com/passql/web/PassqlApplication.java`에 추가:

```java
@SpringBootApplication(scanBasePackages = "com.passql")
@EntityScan(basePackages = "com.passql")
@EnableJpaRepositories(basePackages = "com.passql")
@EnableScheduling
@EnableConfigurationProperties(JwtProperties.class)
public class PassqlApplication {
    public static void main(String[] args) {
        SpringApplication.run(PassqlApplication.class, args);
    }
}
```

import 추가: `org.springframework.boot.context.properties.EnableConfigurationProperties`, `com.passql.member.auth.infrastructure.jwt.JwtProperties`

- [ ] **Step 5: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Member:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/auth/
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : JwtTokenProvider, JwtProperties 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 5: application-dev.yml / application-prod.yml JWT + Firebase 설정 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/application-dev.yml`
- Modify: `server/PQL-Web/src/main/resources/application-prod.yml`

- [ ] **Step 1: application-dev.yml 하단에 추가**

```yaml
jwt:
  access:
    secret: aGVsbG9wYXNzcWxkZXZhY2Nlc3NzZWNyZXRrZXkxMjM0NTY3ODkwYWJjZGVmZ2hpams=
    expiration: 1h
  refresh:
    secret: aGVsbG9wYXNzcWxkZXZyZWZyZXNoc2VjcmV0a2V5MTIzNDU2Nzg5MGFiY2RlZmdoaWpr
    expiration: 14d

firebase:
  key-path: classpath:firebase-service-account-dev.json
```

- [ ] **Step 2: application-prod.yml 하단에 추가**

```yaml
jwt:
  access:
    secret: ${JWT_ACCESS_SECRET}
    expiration: 1h
  refresh:
    secret: ${JWT_REFRESH_SECRET}
    expiration: 14d

firebase:
  key-path: ${FIREBASE_KEY_PATH}
```

> **참고:** prod는 환경변수로 주입. dev용 시크릿은 개발 전용 임시값이며 절대 prod에 사용하지 않는다.
> Firebase 서비스 계정 JSON 파일은 `PQL-Web/src/main/resources/firebase-service-account-dev.json`에 직접 배치 (gitignore 추가 필요).

- [ ] **Step 3: .gitignore에 Firebase 키 파일 추가**

`server/PQL-Web/src/main/resources/` 경로의 `firebase-service-account*.json`을 `.gitignore`에 추가:

```
server/PQL-Web/src/main/resources/firebase-service-account*.json
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/resources/application-dev.yml
git add server/PQL-Web/src/main/resources/application-prod.yml
git add .gitignore
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : jwt, firebase 설정 추가 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 6: Firebase Config 및 소셜 로그인 전략 구현

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/config/FirebaseConfig.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/SocialLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/FirebaseLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/GoogleLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/AppleLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/KakaoLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/NaverLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/GithubLoginStrategy.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/social/strategy/SocialLoginStrategyConfig.java`

- [ ] **Step 1: FirebaseConfig.java 생성**

```java
package com.passql.web.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Configuration
@Profile("!test")
public class FirebaseConfig {

    private static final String LOCAL_CLASSPATH_PREFIX = "classpath:";

    @Value("${firebase.key-path}")
    private String firebaseKeyPath;

    @Bean
    public FirebaseApp firebaseApp() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        try (InputStream serviceAccount = getServiceAccountStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            return FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            log.error("[Firebase] 초기화 실패. keyPath={}", firebaseKeyPath, e);
            throw new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }

    private InputStream getServiceAccountStream() throws IOException {
        if (firebaseKeyPath.startsWith(LOCAL_CLASSPATH_PREFIX)) {
            String path = firebaseKeyPath.substring(LOCAL_CLASSPATH_PREFIX.length());
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                throw new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
            }
            log.info("[Firebase] classpath 키 로드: {}", path);
            return resource.getInputStream();
        }
        log.info("[Firebase] 파일시스템 키 로드: {}", firebaseKeyPath);
        return new FileInputStream(firebaseKeyPath);
    }
}
```

- [ ] **Step 2: SocialLoginStrategy.java 생성 (인터페이스)**

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.member.constant.AuthProvider;

public interface SocialLoginStrategy {

    /** idToken을 검증하고 해당 provider의 고유 사용자 ID(uid)를 반환한다. */
    String validateAndGetSocialId(String idToken);

    AuthProvider getAuthProvider();
}
```

- [ ] **Step 3: FirebaseLoginStrategy.java 생성 (abstract)**

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public abstract class FirebaseLoginStrategy implements SocialLoginStrategy {

    private final FirebaseAuth firebaseAuth;

    @Override
    public String validateAndGetSocialId(String idToken) {
        try {
            FirebaseToken firebaseToken = firebaseAuth.verifyIdToken(idToken);
            return firebaseToken.getUid();
        } catch (FirebaseAuthException e) {
            AuthErrorCode errorCode = e.getAuthErrorCode();
            throw switch (errorCode) {
                case EXPIRED_ID_TOKEN -> new CustomException(ErrorCode.EXPIRED_FIREBASE_TOKEN);
                case INVALID_ID_TOKEN, REVOKED_ID_TOKEN -> new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
                default -> new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
            };
        }
    }
}
```

- [ ] **Step 4: GoogleLoginStrategy.java 생성**

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.google.firebase.auth.FirebaseAuth;
import com.passql.member.constant.AuthProvider;
import org.springframework.stereotype.Component;

@Component
public class GoogleLoginStrategy extends FirebaseLoginStrategy {

    public GoogleLoginStrategy(FirebaseAuth firebaseAuth) {
        super(firebaseAuth);
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.GOOGLE;
    }
}
```

- [ ] **Step 5: AppleLoginStrategy.java 생성**

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.google.firebase.auth.FirebaseAuth;
import com.passql.member.constant.AuthProvider;
import org.springframework.stereotype.Component;

@Component
public class AppleLoginStrategy extends FirebaseLoginStrategy {

    public AppleLoginStrategy(FirebaseAuth firebaseAuth) {
        super(firebaseAuth);
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.APPLE;
    }
}
```

- [ ] **Step 6: KakaoLoginStrategy.java 생성**

Kakao는 `https://kapi.kakao.com/v2/user/me` 에 accessToken으로 사용자 ID를 조회한다.

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.AuthProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class KakaoLoginStrategy implements SocialLoginStrategy {

    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String validateAndGetSocialId(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                    KAKAO_USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Object id = response.getBody().get("id");
            if (id == null) {
                throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
            }
            return String.valueOf(id);
        } catch (RestClientException e) {
            log.error("[Kakao] 사용자 정보 조회 실패", e);
            throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
        }
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.KAKAO;
    }
}
```

- [ ] **Step 7: NaverLoginStrategy.java 생성**

Naver는 `https://openapi.naver.com/v1/nid/me` 에 accessToken으로 사용자 ID를 조회한다.

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.AuthProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class NaverLoginStrategy implements SocialLoginStrategy {

    private static final String NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @SuppressWarnings("unchecked")
    public String validateAndGetSocialId(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                    NAVER_USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Map<String, Object> responseBody = response.getBody();
            Map<String, Object> responseInfo = (Map<String, Object>) responseBody.get("response");
            if (responseInfo == null || responseInfo.get("id") == null) {
                throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
            }
            return String.valueOf(responseInfo.get("id"));
        } catch (RestClientException e) {
            log.error("[Naver] 사용자 정보 조회 실패", e);
            throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
        }
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.NAVER;
    }
}
```

- [ ] **Step 8: GithubLoginStrategy.java 생성**

Github는 `https://api.github.com/user` 에 accessToken으로 사용자 ID를 조회한다.

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.AuthProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class GithubLoginStrategy implements SocialLoginStrategy {

    private static final String GITHUB_USER_INFO_URL = "https://api.github.com/user";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String validateAndGetSocialId(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("X-GitHub-Api-Version", "2022-11-28");
            ResponseEntity<Map> response = restTemplate.exchange(
                    GITHUB_USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Object id = response.getBody().get("id");
            if (id == null) {
                throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
            }
            return String.valueOf(id);
        } catch (RestClientException e) {
            log.error("[Github] 사용자 정보 조회 실패", e);
            throw new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
        }
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.GITHUB;
    }
}
```

- [ ] **Step 9: SocialLoginStrategyConfig.java 생성**

```java
package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.member.constant.AuthProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class SocialLoginStrategyConfig {

    @Bean
    public Map<AuthProvider, SocialLoginStrategy> socialLoginStrategyMap(
            List<SocialLoginStrategy> strategies) {
        return strategies.stream()
                .collect(Collectors.toMap(
                        SocialLoginStrategy::getAuthProvider,
                        Function.identity()
                ));
    }
}
```

- [ ] **Step 10: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Member:compileJava :PQL-Web:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 11: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/config/FirebaseConfig.java
git add server/PQL-Domain-Member/src/main/java/com/passql/member/auth/infrastructure/
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : Firebase 설정 및 소셜 로그인 전략 5개 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 7: RefreshTokenRepository (Redis) 구현

**Files:**
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/repository/RefreshTokenRepository.java`

- [ ] **Step 1: RefreshTokenRepository.java 생성**

```java
package com.passql.member.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepository {

    private static final String KEY_PREFIX = "refresh_token:";

    private final StringRedisTemplate stringRedisTemplate;

    public void save(UUID memberUuid, String refreshToken, long ttlMillis) {
        stringRedisTemplate.opsForValue().set(
                KEY_PREFIX + memberUuid,
                refreshToken,
                Duration.ofMillis(ttlMillis)
        );
    }

    public String findByMemberUuid(UUID memberUuid) {
        return stringRedisTemplate.opsForValue().get(KEY_PREFIX + memberUuid);
    }

    public void delete(UUID memberUuid) {
        stringRedisTemplate.delete(KEY_PREFIX + memberUuid);
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Member:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/auth/repository/
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : RefreshTokenRepository Redis 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 8: AuthService 구현

**Files:**
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/application/dto/command/LoginCommand.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/application/dto/result/LoginResult.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/application/AuthService.java`

- [ ] **Step 1: LoginCommand.java 생성**

```java
package com.passql.member.auth.application.dto.command;

import com.passql.member.constant.AuthProvider;

public record LoginCommand(AuthProvider authProvider, String idToken) {}
```

- [ ] **Step 2: LoginResult.java 생성**

```java
package com.passql.member.auth.application.dto.result;

import com.passql.member.auth.domain.Tokens;
import com.passql.member.entity.Member;

public record LoginResult(Member member, boolean isNewMember, Tokens tokens) {

    public static LoginResult of(Member member, boolean isNewMember, Tokens tokens) {
        return new LoginResult(member, isNewMember, tokens);
    }
}
```

- [ ] **Step 3: AuthService.java 생성**

```java
package com.passql.member.auth.application;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.common.util.NicknameGenerator;
import com.passql.member.auth.application.dto.command.LoginCommand;
import com.passql.member.auth.application.dto.result.LoginResult;
import com.passql.member.auth.domain.Tokens;
import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import com.passql.member.auth.infrastructure.social.strategy.SocialLoginStrategy;
import com.passql.member.auth.repository.RefreshTokenRepository;
import com.passql.member.constant.AuthProvider;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final int NICKNAME_RETRY = 3;

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NicknameGenerator nicknameGenerator;
    private final Map<AuthProvider, SocialLoginStrategy> socialLoginStrategyMap;

    /** 소셜 로그인. 신규면 가입 처리 후 201, 기존이면 200 반환용 isNewMember 플래그 포함. */
    @Transactional
    public LoginResult login(LoginCommand command) {
        SocialLoginStrategy strategy = socialLoginStrategyMap.get(command.authProvider());
        if (strategy == null) {
            throw new CustomException(ErrorCode.UNSUPPORTED_AUTH_PROVIDER);
        }

        String socialId = strategy.validateAndGetSocialId(command.idToken());
        boolean isNew = false;

        Member member = memberRepository
                .findByAuthProviderAndProviderUserIdAndIsDeletedFalse(command.authProvider(), socialId)
                .orElseGet(() -> {
                    Member newMember = registerNewMember(socialId, command.authProvider());
                    log.info("[Auth] 신규 가입: uuid={}, provider={}", newMember.getMemberUuid(), command.authProvider());
                    return newMember;
                });

        // isNew 판별: member가 새로 저장된 경우
        isNew = member.getCreatedAt() != null &&
                member.getCreatedAt().isAfter(member.getUpdatedAt() != null ? member.getUpdatedAt().minusSeconds(1) : member.getCreatedAt().minusSeconds(1));

        Tokens tokens = issueTokens(member);
        return LoginResult.of(member, isNew, tokens);
    }

    /** RefreshToken으로 토큰 재발급. */
    @Transactional
    public Tokens reissueTokens(String refreshToken) {
        UUID memberUuid = jwtTokenProvider.getMemberUuidFromRefreshToken(refreshToken);

        String stored = refreshTokenRepository.findByMemberUuid(memberUuid);
        if (!refreshToken.equals(stored)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        return issueTokens(member);
    }

    /** 로그아웃 — Redis RefreshToken 삭제. 만료 토큰도 UUID 파싱 후 삭제 시도. */
    public void logout(String refreshToken) {
        jwtTokenProvider.getMemberUuidFromRefreshTokenSilently(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    private Member registerNewMember(String socialId, AuthProvider authProvider) {
        for (int attempt = 1; attempt <= NICKNAME_RETRY; attempt++) {
            String nickname = nicknameGenerator.generateUnique(
                    memberRepository::existsByNicknameAndIsDeletedFalse);
            Member member = Member.signUp(socialId, authProvider, null, false, nickname);
            try {
                return memberRepository.saveAndFlush(member);
            } catch (DataIntegrityViolationException e) {
                log.warn("[Auth] 닉네임 충돌 재시도 {}/{}", attempt, NICKNAME_RETRY);
                if (attempt == NICKNAME_RETRY) {
                    throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED, e);
                }
            }
        }
        throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED);
    }

    private Tokens issueTokens(Member member) {
        String accessToken = jwtTokenProvider.createAccessToken(member);
        String refreshToken = jwtTokenProvider.createRefreshToken(member);
        refreshTokenRepository.save(member.getMemberUuid(), refreshToken,
                jwtTokenProvider.getRefreshTokenExpirationMillis());
        return new Tokens(accessToken, refreshToken);
    }
}
```

> **참고:** `isNew` 판별 로직은 단순화를 위해 `saveAndFlush` 후 새 객체 여부로 확인. `registerNewMember`가 호출된 경우만 `true`로 처리하도록 내부 flag를 사용하는 것이 더 명확하다. 아래 Step에서 리팩토링한다.

- [ ] **Step 4: AuthService isNew 로직 단순화**

`login()` 메서드의 `isNew` 판별을 `AuthUserData` record 패턴으로 교체:

```java
@Transactional
public LoginResult login(LoginCommand command) {
    SocialLoginStrategy strategy = socialLoginStrategyMap.get(command.authProvider());
    if (strategy == null) {
        throw new CustomException(ErrorCode.UNSUPPORTED_AUTH_PROVIDER);
    }

    String socialId = strategy.validateAndGetSocialId(command.idToken());

    Optional<Member> existing = memberRepository
            .findByAuthProviderAndProviderUserIdAndIsDeletedFalse(command.authProvider(), socialId);

    boolean isNew = existing.isEmpty();
    Member member = existing.orElseGet(() -> registerNewMember(socialId, command.authProvider()));

    Tokens tokens = issueTokens(member);
    return LoginResult.of(member, isNew, tokens);
}
```

(Step 3에서 만든 불필요한 `isNew` 로직 제거 후 이 버전으로 교체)

- [ ] **Step 5: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Domain-Member:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/auth/application/
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : AuthService 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 9: Auth 프레젠테이션 레이어 (DTO, 애너테이션, Controller)

**Files:**
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/annotation/AuthMember.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/dto/request/LoginRequest.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/dto/request/ReissueRequest.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/dto/request/LogoutRequest.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/dto/response/LoginResponse.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/dto/response/ReissueResponse.java`
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/AuthController.java`

- [ ] **Step 1: AuthMember.java 생성**

```java
package com.passql.member.auth.presentation.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuthMember {}
```

- [ ] **Step 2: LoginRequest.java 생성**

```java
package com.passql.member.auth.presentation.dto.request;

import com.passql.member.auth.application.dto.command.LoginCommand;
import com.passql.member.constant.AuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(

        @NotNull(message = "소셜 플랫폼 정보는 필수입니다.")
        AuthProvider authProvider,

        @NotBlank(message = "소셜 인증 토큰(ID Token)은 필수입니다.")
        String idToken
) {
    public LoginCommand toCommand() {
        return new LoginCommand(authProvider, idToken);
    }
}
```

- [ ] **Step 3: ReissueRequest.java 생성**

```java
package com.passql.member.auth.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ReissueRequest(
        @NotBlank(message = "리프레시 토큰은 필수입니다.")
        String refreshToken
) {}
```

- [ ] **Step 4: LogoutRequest.java 생성**

```java
package com.passql.member.auth.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "리프레시 토큰은 필수입니다.")
        String refreshToken
) {}
```

- [ ] **Step 5: LoginResponse.java 생성**

```java
package com.passql.member.auth.presentation.dto.response;

import com.passql.member.auth.application.dto.result.LoginResult;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        boolean isNewMember,
        UUID memberUuid,
        String nickname
) {
    public static LoginResponse from(LoginResult result) {
        return new LoginResponse(
                result.tokens().accessToken(),
                result.tokens().refreshToken(),
                result.isNewMember(),
                result.member().getMemberUuid(),
                result.member().getNickname()
        );
    }
}
```

- [ ] **Step 6: ReissueResponse.java 생성**

```java
package com.passql.member.auth.presentation.dto.response;

import com.passql.member.auth.domain.Tokens;

public record ReissueResponse(String accessToken, String refreshToken) {

    public static ReissueResponse from(Tokens tokens) {
        return new ReissueResponse(tokens.accessToken(), tokens.refreshToken());
    }
}
```

- [ ] **Step 7: AuthController.java 생성**

```java
package com.passql.web.controller;

import com.passql.member.auth.application.AuthService;
import com.passql.member.auth.application.dto.result.LoginResult;
import com.passql.member.auth.domain.Tokens;
import com.passql.member.auth.presentation.dto.request.LoginRequest;
import com.passql.member.auth.presentation.dto.request.LogoutRequest;
import com.passql.member.auth.presentation.dto.request.ReissueRequest;
import com.passql.member.auth.presentation.dto.response.LoginResponse;
import com.passql.member.auth.presentation.dto.response.ReissueResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResult result = authService.login(request.toCommand());
        LoginResponse response = LoginResponse.from(result);
        return result.isNewMember()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.ok(response);
    }

    @PostMapping("/reissue")
    public ResponseEntity<ReissueResponse> reissue(@RequestBody @Valid ReissueRequest request) {
        Tokens tokens = authService.reissueTokens(request.refreshToken());
        return ResponseEntity.ok(ReissueResponse.from(tokens));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 8: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 9: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/auth/presentation/
git add server/PQL-Web/src/main/java/com/passql/web/controller/AuthController.java
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : Auth 프레젠테이션 레이어 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 10: Spring Security — JwtAuthenticationFilter, LoginMember, SecurityConfig

**Files:**
- Create: `server/PQL-Common/src/main/java/com/passql/common/security/LoginMember.java`
- Create: `server/PQL-Common/src/main/java/com/passql/common/security/LoginMemberArgumentResolver.java`
- Create: `server/PQL-Common/src/main/java/com/passql/common/security/JwtAuthenticationFilter.java`
- Modify: `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java`

- [ ] **Step 1: LoginMember.java 생성**

```java
package com.passql.common.security;

import com.passql.member.constant.MemberRole;

import java.util.UUID;

public record LoginMember(UUID memberUuid, MemberRole role) {}
```

- [ ] **Step 2: JwtAuthenticationFilter.java 생성**

```java
package com.passql.common.security;

import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import com.passql.member.constant.MemberRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (StringUtils.hasText(token)) {
            try {
                UUID memberUuid = jwtTokenProvider.getMemberUuidFromAccessToken(token);
                MemberRole role = jwtTokenProvider.getRoleFromAccessToken(token);
                LoginMember loginMember = new LoginMember(memberUuid, role);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                loginMember,
                                null,
                                List.of(new SimpleGrantedAuthority(role.getAuthority()))
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // 유효하지 않은 토큰 — SecurityContext 비우고 다음 필터로 진행
                // 인증 필요 경로는 SecurityConfig에서 401 처리
                SecurityContextHolder.clearContext();
                log.debug("[JwtFilter] 토큰 검증 실패: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
```

- [ ] **Step 3: LoginMemberArgumentResolver.java 생성**

```java
package com.passql.common.security;

import com.passql.member.auth.presentation.annotation.AuthMember;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class LoginMemberArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType().equals(LoginMember.class)
                && parameter.hasParameterAnnotation(AuthMember.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof LoginMember)) {
            return null;
        }
        return authentication.getPrincipal();
    }
}
```

- [ ] **Step 4: SecurityConfig.java 수정**

```java
package com.passql.web.config;

import com.passql.common.security.JwtAuthenticationFilter;
import com.passql.member.auth.infrastructure.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/admin/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
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

- [ ] **Step 5: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: 커밋**

```bash
git add server/PQL-Common/src/main/java/com/passql/common/security/
git add server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : JwtAuthenticationFilter, SecurityConfig 구현 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 11: WebMvcConfig에 LoginMemberArgumentResolver 등록

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/config/WebMvcConfig.java` (파일이 없으면 생성)

- [ ] **Step 1: WebMvcConfig에 ArgumentResolver 등록**

기존 `WebMvcConfig.java`가 없다면 생성, 있다면 `addArgumentResolvers` 추가:

```java
package com.passql.web.config;

import com.passql.common.security.LoginMemberArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new LoginMemberArgumentResolver());
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/config/WebMvcConfig.java
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : LoginMemberArgumentResolver 등록 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 12: MemberController 및 MemberService 하드리셋

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/MemberController.java`
- Modify: `server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java`

- [ ] **Step 1: MemberService에서 register() 삭제**

`MemberService.java`에서 다음을 삭제:
- `register()` 메서드 전체
- `getMe(UUID memberUuid)` → `getMe(UUID memberUuid)` 시그니처는 유지하되 내부적으로 `@AuthMember`로 전환되면 UUID를 LoginMember에서 꺼내 쓰도록 변경 없이 두어도 됨 (컨트롤러에서 처리)

삭제 후 `UNIQUE_CONFLICT_RETRY`, `NicknameGenerator` 주입은 `regenerateNickname`에서 여전히 필요하므로 유지.

- [ ] **Step 2: MemberController 수정**

```java
package com.passql.web.controller;

import com.passql.common.security.LoginMember;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController implements MemberControllerDocs {

    private final MemberService memberService;

    @GetMapping("/me")
    public MemberMeResponse getMe(@AuthMember LoginMember loginMember) {
        return memberService.getMe(loginMember.memberUuid());
    }

    @PostMapping("/me/regenerate-nickname")
    public NicknameRegenerateResponse regenerateNickname(@AuthMember LoginMember loginMember) {
        return memberService.regenerateNickname(loginMember.memberUuid());
    }
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/MemberController.java
git add server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : MemberController/Service 익명회원 제거 및 토큰 기반 전환 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 13: Flyway 마이그레이션

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_155__auth_cleanup.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- ANONYMOUS authProvider 데이터 정리 (OAuth 하드리셋)
DELETE FROM member WHERE auth_provider = 'ANONYMOUS';
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/db/migration/V0_0_155__auth_cleanup.sql
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : ANONYMOUS 회원 데이터 정리 마이그레이션 https://github.com/passQL-Lab/passQL/issues/271"
```

---

## Task 14: 전체 빌드 및 애플리케이션 기동 확인

- [ ] **Step 1: 전체 빌드**

```bash
cd server && ./gradlew build -x test
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 2: dev 프로파일로 기동 확인**

```bash
cd server && ./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```
Expected: Started PassqlApplication (또는 동일한 메인 클래스명)

- [ ] **Step 3: 인증 엔드포인트 스모크 테스트**

빈 body로 POST 시 validation 에러가 정상 반환되는지 확인:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```
Expected:
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "소셜 플랫폼 정보는 필수입니다., 소셜 인증 토큰(ID Token)은 필수입니다."
}
```

- [ ] **Step 4: 보호 API 미인증 접근 확인**

```bash
curl -X GET http://localhost:8080/api/members/me | jq .
```
Expected: HTTP 401

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "OAuth 및 JWT 인증 시스템 구현 및 적용 필요 : feat : 인증 시스템 전체 통합 완료 https://github.com/passQL-Lab/passQL/issues/271"
```
