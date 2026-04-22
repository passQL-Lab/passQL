# ⚙️[기능추가][Auth] Firebase 프로젝트 생성 및 Secret 설정

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- OAuth + JWT 인증 백엔드 코드는 구현 완료됐으나, Firebase 서비스 계정 JSON이 미발급 상태
- `FIREBASE_SERVICE_ACCOUNT_PROD_JSON` GitHub Secret 미등록으로 prod 배포 시 Firebase 초기화 실패
- `APPLICATION_PROD_YML` Secret에 `jwt`, `firebase` 설정 블록이 없어 prod 기동 시 오류 발생
- 로컬 dev 환경에도 `firebase-service-account-dev.json`이 없어 dev 서버 기동 불가

🛠️해결 방안 / 제안 기능
---

- Firebase 콘솔에서 passQL 프로젝트 신규 생성
- Authentication에서 사용할 OAuth provider 활성화 (Google 우선, 나머지 순차 추가)
- 서비스 계정 JSON 발급 후 로컬 및 GitHub Secret에 등록
- `APPLICATION_PROD_YML` Secret에 jwt + firebase 설정 추가

⚙️작업 내용
---

- [ ] [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 생성 (`passql`)
- [ ] Authentication → Sign-in method → **Google** 활성화
- [ ] Authentication → Sign-in method → **Apple** 활성화 (Apple Developer 계정 필요)
- [ ] Authentication → Sign-in method → **Github** 활성화 (Github OAuth App 등록 필요)
- [ ] 카카오 개발자 콘솔에서 앱 등록 → REST API 키 확보 (Firebase 외부 연동)
- [ ] 네이버 개발자 센터에서 앱 등록 → Client ID/Secret 확보 (Firebase 외부 연동)
- [ ] Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → **새 비공개 키 생성** (JSON 다운로드)
- [ ] 다운로드한 JSON을 `server/PQL-Web/src/main/resources/firebase-service-account-dev.json`으로 복사 (로컬 dev용)
- [ ] GitHub Secrets에 `FIREBASE_SERVICE_ACCOUNT_PROD_JSON` 등록 (JSON 내용 전체)
- [ ] `openssl rand -base64 64`로 JWT secret 2개 생성 (access용, refresh용)
- [ ] `APPLICATION_PROD_YML` Secret에 아래 블록 추가:
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
- [ ] dev 서버 기동 확인 (`POST /api/auth/login` 빈 body → validation 에러 정상 반환)
- [ ] prod 배포 후 Firebase 초기화 로그 확인

🙋‍♂️담당자
---

- 백엔드:
