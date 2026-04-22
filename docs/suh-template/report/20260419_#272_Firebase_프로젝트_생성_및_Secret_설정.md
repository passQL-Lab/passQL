# Firebase 프로젝트 생성 및 Secret 설정

**이슈**: [#272](https://github.com/passQL-Lab/passQL/issues/272)

---

### 📌 작업 개요

OAuth + JWT 인증 백엔드 코드는 구현 완료된 상태이나, Firebase 서비스 계정 JSON 미발급 및 GitHub Secret 미등록으로 prod 배포 시 Firebase 초기화 실패. JWT 설정 블록도 `APPLICATION_PROD_YML` Secret에 누락되어 prod 기동 불가 상태. Firebase 콘솔에서 프로젝트 신규 생성 후 서비스 계정 JSON 발급 및 각 Secret 등록 작업 수행.

---

### 🎯 구현 목표

- Firebase 프로젝트 신규 생성 및 Google OAuth provider 활성화
- 카카오·네이버 OAuth provider 외부 연동 키 확보
- 서비스 계정 JSON 발급 → 로컬 dev용 파일 배치 및 GitHub Secret 등록
- `APPLICATION_PROD_YML` Secret에 `jwt`, `firebase` 설정 블록 추가
- dev 서버 정상 기동 및 prod 배포 후 Firebase 초기화 확인

---

### ✅ 구현 내용

#### Firebase 프로젝트 생성 및 서비스 계정 JSON 발급
- **위치**: Firebase 콘솔 → 프로젝트 설정 → 서비스 계정
- **변경 내용**: passQL 신규 프로젝트 생성 → Authentication 활성화 → 새 비공개 키 생성(JSON 다운로드)
- **이유**: `FirebaseConfig.java`가 `firebase.key-path` 경로의 JSON을 읽어 `FirebaseApp`을 초기화하므로 실제 서비스 계정 파일 필요

#### 로컬 dev 환경 서비스 계정 JSON 배치
- **파일**: `server/PQL-Web/src/main/resources/firebase-service-account-dev.json`
- **변경 내용**: 다운로드한 JSON을 `.json.example` 형식에 맞춰 배치
- **이유**: `application-dev.yml`의 `firebase.key-path: classpath:firebase-service-account.json` 경로에 실제 파일이 없어 dev 서버 기동 불가 상태였음

#### GitHub Secret - FIREBASE_SERVICE_ACCOUNT_PROD_JSON 등록
- **위치**: GitHub → Settings → Secrets → Actions
- **변경 내용**: 발급한 서비스 계정 JSON 전체 내용 등록
- **이유**: prod 배포 시 CI/CD 워크플로우가 해당 Secret을 `firebase-service-account-prod.json`으로 주입

#### APPLICATION_PROD_YML Secret에 jwt·firebase 블록 추가
- **위치**: GitHub → Settings → Secrets → `APPLICATION_PROD_YML`
- **변경 내용**: 아래 블록 추가

```yaml
jwt:
  access:
    secret: {BASE64_SECRET}
    expiration: 1h
  refresh:
    secret: {BASE64_SECRET}
    expiration: 14d

firebase:
  key-path: classpath:firebase-service-account-prod.json
```

- **이유**: prod `application-prod.yml`에 `jwt`, `firebase` 설정이 없으면 `JwtProvider` 및 `FirebaseConfig` 빈 생성 실패로 애플리케이션 기동 불가

#### 카카오·네이버 OAuth 외부 연동 키 확보 (Firebase 미지원 provider)
- **위치**: 카카오 개발자 콘솔, 네이버 개발자 센터
- **변경 내용**: 각 플랫폼에 앱 등록 → REST API 키 / Client ID·Secret 확보
- **이유**: Firebase Authentication은 카카오·네이버를 직접 지원하지 않아 별도 외부 연동 방식 필요. `FirebaseLoginStrategy`가 Firebase 토큰 검증 후 자체 JWT 발급하는 구조이므로, 카카오·네이버는 직접 OAuth 코드 교환 흐름 구현 예정

---

### 🔧 주요 변경사항 상세

#### FirebaseConfig.java 동작 방식

```java
// classpath: 접두사면 ClassPathResource로 로드, 아니면 FileInputStream으로 로드
private InputStream getServiceAccountStream() throws IOException {
    if (firebaseKeyPath.startsWith(CLASSPATH_PREFIX)) {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
        }
        return resource.getInputStream();
    }
    return new FileInputStream(firebaseKeyPath);
}
```

dev/prod 환경 모두 `classpath:` 방식을 사용하므로, 환경별로 다른 JSON 파일명을 `application-{profile}.yml`에서 지정하는 구조.

#### JWT Secret 생성 방법
```bash
openssl rand -base64 64
```
access용·refresh용 각각 1개씩 생성하여 등록.

**특이사항**:
- `firebase-service-account-dev.json`은 `.gitignore`에 등록되어 있어야 하며 레포에 커밋하면 안 됨. `.json.example` 파일만 레포에 포함
- prod JSON 파일명은 `firebase-service-account-prod.json`으로 dev와 분리. CI/CD에서 Secret을 해당 경로로 주입

---

### 🧪 테스트 및 검증

- dev 서버 기동 후 `POST /api/auth/login` 빈 body 요청 → validation 에러 정상 반환 확인 (Firebase 초기화 성공 지표)
- prod 배포 후 애플리케이션 시작 로그에서 `[Firebase] classpath 키 로드` 메시지 확인

---

### 📌 참고사항

- 서비스 계정 JSON은 민감 정보이므로 절대 레포에 커밋 금지
- 카카오·네이버 OAuth는 Firebase Authentication 미지원 provider로, 별도 구현 이슈로 분리 예정
- JWT secret은 `openssl rand -base64 64`로 생성한 값 사용 권장 (충분한 엔트로피 확보)
