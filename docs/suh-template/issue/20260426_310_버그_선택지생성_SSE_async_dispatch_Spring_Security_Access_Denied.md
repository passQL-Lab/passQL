---
title: "❗[버그][선택지생성] SSE async dispatch 시 Spring Security Access Denied로 선택지 생성 실패"
labels: [작업전]
assignees: [Cassiiopeia]
---

🗒️ 설명
---

오늘의 문제(`/daily-challenge`) 진입 시 AI 선택지 생성 SSE 스트림에서 "선택지 생성에 실패했어요" 에러가 표시된다.

백엔드 로그 상 SSE `complete` 이벤트는 정상 전송되나, Tomcat의 async dispatch 단계에서 Spring Security가 `AuthorizationDeniedException: Access Denied`를 던지며 응답이 이미 커밋된 상태에서 예외 처리가 불가능해진다.

- 관련 파일: `server/PQL-Web/src/main/java/com/passql/web/config/SecurityConfig.java`

🔄 재현 방법
---

1. `/daily-challenge` 페이지 진입
2. 선택지 생성 SSE 스트림 시작 대기
3. "선택지 생성에 실패했어요" 에러 메시지 확인

📸 참고 자료
---

백엔드 에러 로그:

```
AuthorizationDeniedException: Access Denied (AuthorizationFilter.java:99)
Unable to handle the Spring Security Exception because the response is already committed.
발생 위치: AsyncContextImpl$AsyncRunnable.run (Tomcat async dispatch)
```

원인: `SecurityConfig`에 `dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()` 누락.
SSE `SseEmitter`는 Tomcat async context를 사용하며, `complete` 전송 후 `AsyncContext.dispatch()` 호출 시 Security Filter Chain을 재통과하는데 이때 인증 정보가 없어 Access Denied 발생.

✅ 예상 동작
---

SSE `complete` 이벤트 수신 후 선택지 4개가 정상 표시되어야 한다.

⚙️ 환경 정보
---

- Spring Security 6.4.4
- Tomcat (spring-boot embedded)
- SSE: `SseEmitter` 사용

🙋‍♂️ 담당자
---

- **백엔드**: SUH SAECHAN
