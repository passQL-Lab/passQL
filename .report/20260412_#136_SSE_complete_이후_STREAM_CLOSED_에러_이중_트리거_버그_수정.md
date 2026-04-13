# ❗[버그][SSE] SSE complete 이벤트 수신 후 STREAM_CLOSED 에러 트리거 버그 #136

## 개요

선택지 생성 SSE 스트림에서 서버가 `complete` 이벤트를 정상 전송했음에도 UI에 "서버 연결이 예기치 않게 끊겼어요"가 표시되는 버그. 원인은 네 가지 독립 문제로 구성됨: (1) `suh-logger`의 `SuhLoggingFilter`가 SSE 응답을 `ContentCachingResponseWrapper`로 버퍼링해 스트림 데이터가 클라이언트에 전달되지 않는 문제, (2) `exclude-patterns`가 Ant 패턴이 아닌 `String.contains()` 기반이라 `**/generate-choices` 패턴 매칭 실패, (3) `needsSseGeneration`이 React effect deps에 포함되어 `onComplete` 후 리렌더 시 cleanup이 즉시 호출되어 스트림을 abort하는 race condition, (4) `question` 객체가 effect deps에 포함되어 React Query background refetch 시 객체 참조가 바뀌어 진행 중인 SSE 스트림이 abort되는 문제.

## 변경 사항

### 프론트엔드 (FE)

- `client/src/api/questions.ts`: `done: true` 블록에서 `STREAM_CLOSED` 에러 트리거 조건에 `!abortProcessing` 추가
- `client/src/pages/QuestionDetail.tsx`: SSE effect deps에서 `needsSseGeneration` 및 `question` 제거, `questionUuid`/`sseRetryCount`만 유지. `sseTriggeredRef`로 동일 questionUuid+sseRetryCount 조합에서 SSE를 최초 1회만 실행하도록 보장

### 백엔드 설정 (BE)

- `server/PQL-Web/src/main/resources/application.yml`: `suh-logger.exclude-patterns`에 `generate-choices` 추가 (`String.contains()` 기반이므로 Ant 패턴 불필요)

## 주요 구현 내용

### 문제 1 — SuhLoggingFilter의 SSE 스트림 버퍼링

`suh-logger` 라이브러리의 `SuhLoggingFilter`(`OncePerRequestFilter` 구현체)가 응답 로깅을 위해 모든 응답을 `ContentCachingResponseWrapper`로 감쌌다. 이 래퍼는 응답 본문을 서버 메모리에 전부 버퍼링한 뒤 한 번에 내보내는 방식이라 SSE 스트림이 완료될 때까지 클라이언트에 데이터를 전달하지 않았다. EventStream 탭이 비어 있고 브라우저가 연결 종료로 판단해 `STREAM_CLOSED`를 발생시켰다.

```yaml
suh-logger:
  exclude-patterns:
    - "generate-choices"  # String.contains() 기반이므로 suffix 문자열만 지정
```

### 문제 2 — excludePatterns가 Ant 패턴 아닌 String.contains() 기반

`SuhLoggingFilter.shouldExcludeFromLogging()`이 Ant 패턴 매칭이 아닌 `String.contains()`로 구현되어 있어 `**/generate-choices` 패턴이 리터럴 문자열로 취급되어 매칭 실패했다. `generate-choices`로 수정해 해결.

### 문제 3 — needsSseGeneration deps race condition

`needsSseGeneration`이 effect deps에 포함되어 있어 `onComplete` → `setSseChoices` → 리렌더 → `needsSseGeneration=false` → effect cleanup → `abortController.abort()` 순서로 스트림이 abort됐다. `complete`를 받아 상태를 업데이트했더니 그 업데이트가 스트림을 abort하는 자충수였다.

**수정**: deps에서 `needsSseGeneration`(및 그 구성 요소인 `sseChoices`, `sseError`) 제거, effect 본문 첫 줄에서 직접 체크하는 방식으로 변경.

```ts
// 수정 전: needsSseGeneration이 deps에 있어 onComplete 후 cleanup 즉시 호출
}, [needsSseGeneration, questionUuid, sseRetryCount]);

// 수정 후: question 로드 트리거만 유지, onComplete 후 리렌더 시 재실행 차단
}, [questionUuid, sseRetryCount, question]);
```

### 문제 4 — abortProcessing 플래그 미체크 (부수 수정)

`processBuffer()` 내 `PARSE_ERROR` 발생 시 `abortProcessing=true`로 설정되지만 `done: true` 분기에서 미체크로 `STREAM_CLOSED`가 중복 트리거됐다.

```ts
// 수정 후
if (!receivedTerminalEvent && !abortProcessing && !abortController.signal.aborted) {
  callbacks.onError({ code: "STREAM_CLOSED", ... });
}
```

### 문제 5 — React Query background refetch 시 question 참조 변경으로 SSE abort

문제 3 수정 후에도 일부 문제(특히 AI 3회 재시도가 발생하는 케이스)에서 여전히 에러가 재현됐다. SSE 스트림이 오래 걸리는 동안 React Query가 background refetch를 수행하면 `question` 객체의 참조가 새로 생성된다. `question`이 effect deps에 있었기 때문에 이 참조 변경이 effect 재실행 → cleanup → `abortController.abort()` 로 이어졌다.

서버 로그와 `fetch()` 콘솔 테스트에서 `complete` 이벤트와 선택지 4개가 정상 도착하는 것이 확인됐으나, 그 사이에 abort가 발생해 `onComplete` 콜백이 무시되고 `STREAM_CLOSED`가 트리거됐다.

**수정**: `question`을 deps에서 제거하고 `sseTriggeredRef`를 도입해 `questionUuid:sseRetryCount` 조합당 SSE를 최초 1회만 실행하도록 보장.

```ts
// SSE 생성 실행 여부 추적 — question 로드 후 1회만 실행, background refetch로 재실행 방지
const sseTriggeredRef = useRef(false);

// questionUuid 또는 sseRetryCount가 바뀌면 트리거 플래그 리셋
const prevTriggerKeyRef = useRef<string>("");
const triggerKey = `${questionUuid ?? ""}:${sseRetryCount}`;
if (prevTriggerKeyRef.current !== triggerKey) {
  prevTriggerKeyRef.current = triggerKey;
  sseTriggeredRef.current = false;
}

useEffect(() => {
  if (!needsSseGeneration || !questionUuid || sseTriggeredRef.current) return;
  sseTriggeredRef.current = true;
  // ...
}, [questionUuid, sseRetryCount]); // question 제외 — background refetch 시 abort 방지
```

## 주의사항

- 향후 SSE 엔드포인트가 추가될 경우 `suh-logger.exclude-patterns`에 suffix 문자열로 등록해야 한다.
- SSE effect의 deps에 스트림 결과 상태(`sseChoices`, `sseError`) 또는 React Query가 관리하는 객체(`question`)를 넣으면 동일한 race condition이 재발한다.
- SSE 스트림이 오래 걸릴수록 background refetch와 겹칠 확률이 높아진다. AI 재시도(최대 3회)가 발생하는 케이스에서 특히 취약하다.
