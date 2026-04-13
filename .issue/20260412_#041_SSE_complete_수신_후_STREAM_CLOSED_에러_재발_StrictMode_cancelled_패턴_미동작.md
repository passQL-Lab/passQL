# ❗[버그][프론트] SSE complete 수신 후 STREAM_CLOSED 에러 재발 — StrictMode cancelled 패턴 미동작

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- `#039` 이슈에서 수정했던 SSE STREAM_CLOSED 버그가 재발함
- 서버는 `complete` 이벤트를 정상 전송하고 SSE 스트림이 200 OK로 종료되었으나, 프론트엔드에서는 "서버 연결이 예기치 않게 끊겼어요" 에러가 표시됨
- 브라우저 DevTools EventStream 탭에서 `status → validating → complete` 이벤트 수신 확인됨
- 브라우저 콘솔에 `[SSE] read`, `[SSE] processBuffer`, `[SSE] complete 수신` 로그가 **전혀 찍히지 않고** 바로 `[SSE] STREAM_CLOSED` 로그만 출력됨
- 즉, `reader.read()`가 `done: true`를 즉시 반환해 파싱 자체가 이뤄지지 않음

🔄재현 방법
---

1. `http://localhost:5174/questions/{questionUuid}` 접근
2. 선택지가 없는 문제(choiceSets: []) 진입
3. 서버에서 AI 선택지 생성 완료 후 SSE complete 전송
4. 화면에 선택지 대신 "서버 연결이 예기치 않게 끊겼어요" 에러 표시됨

📸참고 자료
---

**서버 로그 (정상 전송 확인)**
```
[generate-choices] SSE complete 전송: choiceSetUuid=9fdfc1cf-..., itemCount=4
```

**브라우저 콘솔 (비정상)**
```
[SSE] STREAM_CLOSED: complete/error 없이 스트림 종료
```
— `[SSE] read`, `[SSE] processBuffer`, `[SSE] complete 수신` 로그 없음

**원인 분석**

React StrictMode가 effect를 두 번 실행하는 방식이 문제:

1. 첫 번째 effect 실행 → `cancelled = false` → SSE 연결 시작 → 서버가 스트림 처리 시작
2. StrictMode cleanup 실행 → `cancelled = true` → `cleanup()` (AbortController.abort())
3. 두 번째 effect 실행 → `needsGeneration` 조건 재평가
   - `sseChoices === null`, `sseError === null` → `needsGeneration = true`
   - 두 번째 SSE 연결 시작
4. 서버는 이미 첫 번째 요청을 처리 중이거나 완료 → 두 번째 연결은 `done: true` 즉시 반환
5. `reader.read()` 첫 호출에서 `done: true`, `value: undefined` → 버퍼 비어있음 → `STREAM_CLOSED`

**핵심**: `cancelled` 플래그로 콜백을 막더라도, StrictMode의 cleanup이 abort한 뒤 두 번째 effect가 실행될 때 `needsGeneration`이 여전히 `true`이므로 두 번째 SSE 요청이 서버로 전송됨. 서버 입장에서는 중복 요청이 들어옴.

**관련 파일**
- `client/src/pages/QuestionDetail.tsx` — SSE useEffect 로직 (deps: `[questionUuid, sseRetryCount, activeChoiceSet, question?.executionMode]`)
- `client/src/api/questions.ts` — `generateChoices()` SSE 파싱 로직

✅예상 동작
---

- 서버가 SSE `complete` 이벤트를 전송하면 프론트엔드에서 선택지가 정상 렌더링됨
- 브라우저 콘솔에 `[SSE] complete 수신 → receivedTerminalEvent=true` 로그가 찍혀야 함
- "서버 연결이 예기치 않게 끊겼어요" 에러가 표시되지 않아야 함

⚙️환경 정보
---

- **OS**: macOS
- **브라우저**: Chrome 146 (Android 에뮬레이션 모드)
- **환경**: 로컬 개발 (localhost:5174 → localhost:8080)
- **React**: 19 (StrictMode 활성화)

🙋‍♂️담당자
---

- **백엔드**: -
- **프론트엔드**: 
- **디자인**: -
