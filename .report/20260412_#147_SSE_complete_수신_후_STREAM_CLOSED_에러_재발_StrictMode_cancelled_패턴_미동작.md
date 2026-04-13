# ❗[버그][문제풀이] SSE complete 수신 후 STREAM_CLOSED 에러 재발에 대한 StrictMode cancelled 패턴 미동작 #147

## 개요

Spring SseEmitter가 `event:complete` 이벤트를 정상 전송했음에도 프론트엔드에서 "서버 연결이 예기치 않게 끊겼어요" 에러가 표시되던 버그를 수정했다. 근본 원인은 두 가지였다: (1) Spring SseEmitter가 `event:name` 포맷(콜론 뒤 공백 없음)으로 전송하는데 프론트 파싱 정규식이 `event: name` (공백 있음)만 처리해 이벤트 파싱 자체가 실패했고, (2) React StrictMode의 이중 실행으로 두 번째 SSE 연결이 이미 완료된 스트림에 접근해 빈 응답을 받았다.

## 변경 사항

### 프론트엔드 — SSE 파싱 로직

- `client/src/api/questions.ts`: SSE 이벤트 파싱 방식 전면 재작성
  - 정규식 기반 파싱(`event: `, `data: `) → 라인 단위 파싱으로 교체. Spring(공백 없음)·브라우저 표준(공백 있음) 둘 다 처리
  - `\r\n`, `\r`, `\n` 혼용 포맷 정규화 처리 추가 (RFC 8895 준수)
  - `PARSE_ERROR` 시 `receivedTerminalEvent` 미설정 버그 수정 — STREAM_CLOSED 이중 발화 방지
  - `complete`/`error` 수신 후 즉시 루프 중단 (`return true`) — 불필요한 스트림 read 제거
  - `abortProcessing` 플래그 제거 → `parseAndDispatch` 반환값(`shouldStop`)으로 루프 제어 일원화
  - 각 파싱 단계 디버그 로그 추가 (`[SSE] read`, `flushBuffer`, `parseAndDispatch`, `done`)

### 프론트엔드 — SSE useEffect

- `client/src/pages/QuestionDetail.tsx`: SSE useEffect 안정성 개선
  - `cancelled` 플래그 도입 — StrictMode 이중 실행 시 첫 번째 effect의 콜백을 무력화
  - deps에 `question` 추가 — 비동기 로드 완료(null → 객체) 시 effect 재실행 보장
  - deps에서 `activeChoiceSet`, `question?.executionMode` 제거 — `onComplete`/`onError` 후 effect 재실행으로 인한 중복 요청 방지
  - `needsSseGeneration` 파생 변수 제거 → effect 내부 지역 변수로 이동 (deps 오염 방지)
  - 중복 `setSseError(null)` 제거 — `!sseError` 조건 통과 후 진입하므로 불필요

## 주요 구현 내용

### 근본 원인 1: Spring SseEmitter 포맷 불일치

Spring `SseEmitter.event().name("complete").data(json)`은 다음 포맷으로 직렬화된다:

```
event:complete
data:{"choiceSetId":"...","choices":[...]}

```

기존 정규식 `/^event: (\w+)/m`은 콜론 뒤 공백을 필수로 요구해 `eventMatch`가 null이 됐고, `if (!eventMatch || !dataMatch) continue`로 이벤트 전체가 무시됐다. 결과적으로 `receivedTerminalEvent`가 영원히 `false`로 남아 스트림 종료 시 `STREAM_CLOSED` 에러가 발생했다.

수정: 라인 단위로 파싱하고 `line.startsWith("event:")`로 처리해 공백 유무와 무관하게 동작한다.

### 근본 원인 2: React StrictMode 이중 실행

React 19 StrictMode는 개발 환경에서 effect를 **mount → cleanup → re-mount** 순으로 두 번 실행한다. 기존 코드에는 이 패턴에 대한 대비가 없어, 첫 번째 effect가 abort된 후 두 번째 effect가 동일한 SSE 엔드포인트에 재요청을 보냈다. 서버는 이미 처리를 완료했거나 진행 중이어서 두 번째 연결이 빈 스트림을 받아 즉시 `done: true`를 반환했다.

수정: `cancelled` 플래그로 첫 번째 effect cleanup 시 콜백을 무력화한다. 두 번째 effect 실행 시 `sseChoices === null && sseError === null`이 유지되므로 `needsGeneration = true`가 되어 실제 SSE 연결을 두 번째 effect가 담당하게 된다(React 공식 권장 패턴).

## 주의사항

- 디버그 로그(`console.debug("[SSE] ...")`는 개발 단계 트러블슈팅 목적으로 유지. 프로덕션 배포 전 제거 또는 로그 레벨 관리 필요.
- `question` 객체 전체를 deps에 포함하므로 React Query background refetch 시 `question` 참조가 바뀌면 effect가 재실행된다. `staleTime: 60_000` 설정으로 SSE 진행 중 refetch는 발생하지 않으나, 추후 staleTime 변경 시 주의.
- 이번 수정으로 `#039` 이슈 계열의 SSE 파싱 버그가 근본적으로 해결됐다. 동일 증상이 재발하면 Spring SseEmitter 버전 업데이트로 인한 포맷 변경 여부를 먼저 확인할 것.
