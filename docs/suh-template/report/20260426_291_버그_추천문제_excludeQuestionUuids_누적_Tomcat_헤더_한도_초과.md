# 홈화면 추천 새로고침 반복 시 excludeQuestionUuids 누적으로 Tomcat 헤더 한도 초과 → 400 에러

## 개요

홈 화면에서 AI 추천 문제 새로고침을 반복하면 `excludeQuestionUuids` 파라미터가 세션 내 무제한 누적되어, 일정 횟수 이상 새로고침 시 HTTP 요청 URL이 Tomcat 기본 헤더 한도(8KB)를 초과해 400 에러가 발생하는 버그를 수정했다. GET → POST 전환과 FIFO 30개 제한을 이중으로 적용했다.

## 변경 사항

### 백엔드

- `server/PQL-Domain-Question/.../dto/RecommendationsRequest.java`: 요청 DTO 신규 생성 (size, excludeQuestionUuids를 body로 수신)
- `server/PQL-Web/.../controller/QuestionController.java`: `@GetMapping("/recommendations")` → `@PostMapping("/recommendations")`로 변경, `@RequestParam` → `@RequestBody RecommendationsRequest`로 교체

### 프론트엔드

- `client/src/api/questions.ts`: `fetchRecommendations` 함수를 쿼리스트링 GET → JSON body POST 방식으로 변경
- `client/src/pages/Home.tsx`: `seenUuids` state에 FIFO 30개 제한 적용 (`slice(-30)`)

## 주요 구현 내용

근본 원인은 두 가지가 결합된 것이다. 첫째, 프론트 `seenUuids` state가 리셋 없이 계속 누적된다. 둘째, 누적된 UUID 목록 전체를 쿼리스트링(`?excludeQuestionUuids=...&excludeQuestionUuids=...`)으로 전달해 URL이 길어진다. 약 30회 이상 새로고침하면 URL이 8KB를 초과하고 Tomcat이 `Request header is too large` 예외를 던지는데, 이때 CORS 헤더 없이 400이 반환되어 브라우저에서는 CORS 에러처럼 보인다.

해결책으로 API를 POST로 전환해 제외 목록을 request body에 담아 URL 길이 제한 문제를 근본적으로 제거하고, `seenUuids`를 최신 30개만 유지하는 FIFO 제한을 이중 방어로 추가했다.

## 주의사항

- 추천 API가 GET → POST로 변경되었으므로, 해당 엔드포인트를 캐싱하는 프록시나 CDN이 있다면 캐시 정책 재검토가 필요하다.
- `seenUuids` 30개 제한은 세션 단위로 동작하며 페이지 새로고침(F5) 시 초기화된다.
