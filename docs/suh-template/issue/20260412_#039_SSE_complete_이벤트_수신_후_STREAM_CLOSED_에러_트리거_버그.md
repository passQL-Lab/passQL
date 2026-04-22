# ❗[버그][SSE] SSE complete 이벤트 수신 후 STREAM_CLOSED 에러 트리거 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 선택지 생성 SSE 스트림에서 `complete` 이벤트를 정상 수신했음에도 `STREAM_CLOSED` 에러가 추가로 트리거되어 UI에 "서버 연결이 예기치 않게 끊겼어요" 메시지가 표시되는 버그.
- 서버 로그상 `SSE complete 전송: itemCount=4`로 정상 완료됐으나, 프론트엔드에서 에러 상태로 전환됨.

🔄재현 방법
---

1. 선택지가 없는 문제 상세 페이지 진입 (`CONCEPT_ONLY` 또는 `EXECUTABLE` executionMode)
2. SSE `generate-choices` 요청이 자동 발화되어 선택지 생성 시작
3. 서버에서 AI 선택지를 생성하고 `complete` 이벤트를 전송
4. 정상 완료됐음에도 "서버 연결이 예기치 않게 끊겼어요" 에러 카드가 표시됨

📸참고 자료
---

**서버 로그 (정상 완료)**:
```
[generate-choices] SSE complete 전송: questionUuid=cbef072c-..., choiceSetUuid=7d130bdf-..., itemCount=4
```

**프론트 에러 메시지**: "서버 연결이 예기치 않게 끊겼어요"

**관련 파일**:
- `client/src/api/questions.ts` — `generateChoices()` 함수 내 SSE 파싱 로직

✅예상 동작
---

- 서버에서 `complete` 이벤트를 전송하면 프론트에서 선택지 4개가 정상 렌더링되어야 함.
- `STREAM_CLOSED` 에러는 complete/error 이벤트 없이 스트림이 닫힌 경우에만 트리거되어야 함.

⚙️환경 정보
---

- **OS**: Android
- **브라우저**: Chrome 146
- **기기**: 모바일

🙋‍♂️담당자
---

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름

---

> ✅ 해결 완료 — `client/src/api/questions.ts` `done` 블록에서 `!abortProcessing` 조건 추가.
> `processBuffer()` 내 `PARSE_ERROR` 발생 시 `abortProcessing=true`가 설정되지만, `done` 블록에서 이를 체크하지 않아 `STREAM_CLOSED`도 함께 트리거되던 것이 원인.
