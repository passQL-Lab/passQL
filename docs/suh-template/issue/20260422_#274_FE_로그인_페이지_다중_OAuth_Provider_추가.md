---
제목: ⚙️[기능추가][인증] FE 로그인 페이지 다중 OAuth Provider 버튼 추가
라벨: 작업전
---

# ⚙️[기능추가][인증] FE 로그인 페이지 다중 OAuth Provider 버튼 추가

📝 현재 문제점
---

- `client/src/pages/Login.tsx`에 Google 로그인 버튼만 구현되어 있음
- `client/src/api/auth.ts`의 `AuthProvider` 타입은 `GOOGLE | KAKAO | NAVER | APPLE | GITHUB` 5개를 선언하고 있으나, 실제 로그인 UI에서는 Google만 노출됨
- 백엔드 `AuthController`는 5개 provider 전략(`GoogleLoginStrategy`, `KakaoLoginStrategy`, `NaverLoginStrategy`, `AppleLoginStrategy`, `GithubLoginStrategy`)을 모두 지원하고 있어 프론트 UI만 추가하면 즉시 동작 가능한 상태임
- Kakao/Naver의 경우 Firebase 기반이 아닌 REST API 직접 검증 방식이므로, 프론트에서도 idToken 획득 방식이 Google(Firebase popup)과 다름

🛠️ 해결 방안 / 제안 기능
---

- `client/src/pages/Login.tsx`에 Kakao, Naver, (Apple 선택) 로그인 버튼 추가
- 각 provider별 OAuth 플로우 구현:
  - **Kakao**: Kakao JavaScript SDK 또는 REST API redirect 방식 → authorization code 획득 → 백엔드로 idToken(accessToken) 전달
  - **Naver**: Naver OAuth 2.0 redirect 방식 → authorization code 획득 → 백엔드로 idToken(accessToken) 전달
  - **Apple**: Firebase Apple Provider(`OAuthProvider('apple.com')`) → idToken 획득 → 백엔드로 전달 (Google과 동일 Firebase 방식)
- `client/src/lib/firebase.ts`에 Apple provider 설정 추가
- Kakao/Naver redirect 방식의 경우 `client/src/pages/OAuthCallback.tsx` 콜백 처리 페이지 및 `App.tsx` 라우트 추가 필요
- 기존 `login()` API 함수 (`client/src/api/auth.ts`) 재사용 — `authProvider` 값만 변경
- 마이그레이션 미고려: 기존 localStorage 기반 익명 데이터는 삭제하고 새 계정으로 시작

⚙️ 작업 내용
---

- [ ] `client/src/lib/firebase.ts` — Apple OAuth provider 추가
- [ ] `client/src/pages/Login.tsx` — Kakao, Naver, Apple 버튼 UI 추가 (기존 디자인 시스템 준수)
- [ ] Kakao OAuth SDK/redirect 방식 결정 및 구현 (`client/src/lib/kakao.ts`)
- [ ] Naver OAuth redirect 방식 구현 (`client/src/lib/naver.ts`)
- [ ] `client/src/pages/OAuthCallback.tsx` — Kakao/Naver redirect 콜백 처리 페이지
- [ ] `client/src/App.tsx` — `/oauth/callback` 라우트 추가 (공개 라우트, 인증 불필요)
- [ ] 각 provider 로그인 실패 에러 처리 (팝업 닫힘, 거부, 네트워크 오류 등)

🙋‍♂️ 담당자
---

- 프론트엔드: suhsaechan
