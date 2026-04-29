# SSE async dispatch 시 Spring Security Access Denied로 선택지 생성 실패

## 개요

`/daily-challenge` 페이지 진입 시 AI 선택지 생성이 완료됐음에도 불구하고 브라우저에 "선택지 생성에 실패했어요"가 표시되는 버그를 수정했다. 원인은 SSE 스트림 종료 후 Tomcat의 async dispatch 단계에서 Spring Security가 인증 정보 없이 Filter Chain을 재통과하다가 `AuthorizationDeniedException`을 던지는 것이었으며, `SecurityConfig`에 `DispatcherType.ASYNC` 허용 설정을 추가해 해결했다.

## 변경 사항

### 백엔드 - Security 설정

- `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java`
  - `authorizeHttpRequests` 블록 최상단에 `.dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()` 추가
  - `jakarta.servlet.DispatcherType` import 추가

## 주요 구현 내용

### 문제 발생 구조

SSE(`SseEmitter`)는 Tomcat의 async context를 사용한다. 선택지 생성 완료 후 `complete` 이벤트를 전송하고 나면, Tomcat이 내부적으로 `AsyncContext.dispatch()`를 호출해 연결을 정리한다. 이 dispatch가 Spring Security Filter Chain을 **두 번째로 통과**하는데, 이때 요청 타입이 `REQUEST`가 아닌 `ASYNC`로 바뀐다.

기존 `SecurityConfig`는 `ASYNC` 타입 요청에 대한 허용 설정이 없었기 때문에 `AuthorizationFilter`가 인증 정보 없음으로 판단해 `Access Denied`를 던졌다. 그러나 이미 응답이 커밋된 상태(`response is already committed`)라 에러 응답을 덮어쓸 수 없었고, 결과적으로 브라우저에 `complete` 이벤트가 전달되지 않아 프론트에서 에러로 처리됐다.

### 해결 방식

```java
.authorizeHttpRequests(auth -> auth
    // ASYNC dispatch는 최초 REQUEST에서 JWT 인증이 이미 완료됐으므로 재검사 불필요
    .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
    .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
    ...
)
```

`dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()`을 가장 먼저 선언해 ASYNC 타입 dispatch가 Security 인증 검사를 건너뛰도록 설정했다. 최초 `REQUEST` 단계에서 JWT 인증이 완료된 상태이므로 보안상 문제가 없다.

### 로그 기준 흐름 비교

**수정 전**
```
[SSE complete 전송: itemCount=4]  ← 선택지 생성 성공
[AuthorizationDeniedException: Access Denied]  ← ASYNC dispatch에서 Security 차단
[response is already committed]  ← 에러 처리 불가, 브라우저에 complete 미전달
→ 프론트: "선택지 생성에 실패했어요"
```

**수정 후**
```
[SSE complete 전송: itemCount=4]  ← 선택지 생성 성공
[ASYNC dispatch → permitAll() 통과]  ← Security 검사 생략
→ 프론트: 선택지 4개 정상 표시
```

## 주의사항

- 이 설정은 `ASYNC` dispatcher 타입 전체에 적용되므로, SSE 외에 다른 async 엔드포인트에도 영향을 준다. 현재 프로젝트에서 ASYNC를 사용하는 엔드포인트는 `generate-choices`가 유일하므로 문제없다.
- 재배포(서버 재시작) 후 적용된다.
