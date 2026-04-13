# ❗[버그][배포] Vercel prod 환경에서 generate-choices 405 Method Not Allowed

## 개요

Vercel 프로덕션 환경에서 선택지 생성 SSE 요청(`generate-choices`)이 405 오류로 실패하는 버그를 수정하였다. `generateChoices()`가 `fetch('/api/...')`로 URL을 하드코딩하여 Vercel 자체로 요청이 전달되었고, `VITE_API_BASE_URL` 환경변수 미설정 시 폴백값도 로컬 Vite 프록시용 `/api`로만 설정되어 있어 prod에서 실제 API 서버에 연결되지 않았다.

## 변경 사항

### 프론트엔드 — API 클라이언트

- `client/src/api/client.ts`
  - `BASE_URL`을 `export`로 변경하여 외부 모듈에서 사용 가능하도록 수정
  - `VITE_API_BASE_URL` 미설정 시 DEV 환경은 `/api`(Vite 프록시), prod 환경은 `https://api.passql.suhsaechan.kr/api`를 기본값으로 적용
  - `VITE_USE_MOCK` 미설정 시 기본값 `"false"` 적용

- `client/src/api/questions.ts`
  - `generateChoices()`에서 `fetch('/api/...')` 하드코딩을 `fetch(\`${BASE_URL}/...\`)`로 수정
  - `BASE_URL`을 `client.ts`에서 import하여 다른 API와 동일한 기반으로 요청

## 주요 구현 내용

`generateChoices()`는 SSE 스트리밍 특성상 `apiFetch()` 래퍼를 사용할 수 없어 `fetch()`를 직접 호출하는 구조다. 이 과정에서 URL을 `/api/...`로 하드코딩하였고, 로컬에서는 Vite 프록시가 이를 백엔드 서버로 포워딩해주어 정상 동작했지만 Vercel에는 해당 프록시가 없어 Vercel 자체가 요청을 받아 405를 반환하였다. `BASE_URL`을 export하여 SSE fetch 구문에서도 동일하게 참조하도록 통일하고, env 미설정 시에도 prod 환경에서 올바른 서버로 연결되도록 폴백 로직을 개선하였다.

## 주의사항

- SSE를 사용하는 다른 엔드포인트가 추가될 경우 동일하게 `BASE_URL`을 참조해야 한다.
- Vercel 환경변수에 `VITE_API_BASE_URL`이 명시적으로 설정되어 있으면 해당 값이 우선 적용된다.
