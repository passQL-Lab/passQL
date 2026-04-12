# 버그 분석 — 선택지 생성 실패 (2026-04-12)

## 개요

`/daily-challenge` 페이지에서 선택지 생성 요청 시 "선택지 생성 중..." 상태로 영구 멈추는 현상 발생.

---

## 재현 환경

- **URL:** `http://localhost:5174/daily-challenge`
- **문제 UUID:** `fc143893-2e86-4071-9e9f-a96c0ef2d745`
- **문제 유형:** `executionMode=EXECUTABLE`, `choiceSetPolicy=AI_ONLY`
- **API:** `POST /api/questions/{questionUuid}/generate-choices` (SSE)

---

## 발견된 버그

---

### 버그 1 (백엔드) — SQL 동치 유형에서 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 3회 연속 실패

#### 문제 설명

해당 문제의 문항:

```
다음 SQL과 동일한 실행 결과를 내는 SQL은?

SELECT A.DEPT_ID, A.NAME, B.NAME AS PARTNER
FROM EMP A
INNER JOIN EMP B ON A.DEPT_ID = B.DEPT_ID
WHERE A.ID <> B.ID
ORDER BY A.DEPT_ID, A.NAME;
```

정답 SQL:
```sql
SELECT A.DEPT_ID, A.NAME, B.NAME AS PARTNER
FROM EMP A
INNER JOIN EMP B ON A.DEPT_ID = B.DEPT_ID
WHERE A.ID <> B.ID
ORDER BY A.DEPT_ID, A.NAME
```

#### 근본 원인

이 문제는 **SQL 동치(Equivalence)** 유형 문항이다.  
`WHERE A.ID <> B.ID`, `WHERE NOT A.ID = B.ID`, `WHERE A.ID != B.ID` 등 표현은 서로 다르지만 **동일한 실행 결과**를 낸다.

AI가 "의도적으로 틀린 선택지"를 만들어도, 샌드박스에서 실행하면 정답 SQL과 같은 결과를 내는 경우가 반복적으로 발생한다.

#### 로그 근거

```
[choice-gen] Sandbox 검증 완료: attempt=1, correctCount=2
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=1/3

[choice-gen] Sandbox 검증 완료: attempt=2, correctCount=2
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=2/3

[choice-gen] Sandbox 검증 완료: attempt=3, correctCount=2
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=3/3

[choice-gen] 최대 재시도 초과: lastErrorCode=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT
```

3회 모두 `correctCount=2` — AI가 재시도해도 동일한 구조적 실패가 반복된다.

#### 영향 범위

- `choiceSetPolicy=AI_ONLY` + `executionMode=EXECUTABLE` 조합의 SQL 동치 유형 문제 전체
- 재시도 3회 소모 후 선택지 생성 실패 → 사용자에게 에러 반환

#### 해결 방향 (제안)

| 방향 | 설명 |
|------|------|
| **정책 전환** | SQL 동치 유형 문제의 `choiceSetPolicy`를 `AI_ONLY` → `RESULT_MATCH`로 변경. `RESULT_MATCH`는 정답 SQL 실행 결과를 기준으로 선택지를 구성하므로 동치 문제가 발생하지 않음 |
| **관리자 알림** | `MULTIPLE_CORRECT` 3회 연속 실패 시 해당 문제를 자동 플래그(flag) 처리하고 관리자에게 알림 |
| **문제 비활성화** | 반복 실패 문제를 자동 `is_active=false`로 전환하여 사용자 노출 차단 |

---

### 버그 2 (프론트엔드) — SSE 에러 수신 실패 시 UI 무한 로딩

#### 문제 설명

선택지 생성이 실패해도 프론트엔드 UI가 "선택지 생성 중..." 상태로 영구 멈춘다.  
사용자는 실패 여부를 알 수 없고, 새로고침 외에 탈출 방법이 없다.

#### 근본 원인

SSE 스트림은 **HTTP 200으로 시작**한다. 이후 백엔드 처리는 가상 스레드에서 비동기로 진행된다.

```
[http-nio-8080-e] Status: 200
[http-nio-8080-e] Response Body: event:status
                                 data:{"phase":"generating","message":"선택지 생성 중..."}
```

이후 백엔드 가상 스레드에서 에러가 발생하는데:

```
[virtual-98] ERROR: CustomException — code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT
```

이 에러가 `onError` SSE 이벤트로 클라이언트에게 **전달되지 않는 경우**, 또는 스트림 연결이 조용히 끊기는 경우, 프론트엔드는 `EventSource`가 닫혔는지 여부를 감지하지 못해 로딩 상태에서 탈출하지 못한다.

#### 현재 프론트 동작 (QuestionDetail.tsx)

```tsx
// SSE 이벤트 핸들러 등록
eventSource.addEventListener('status', ...)
eventSource.addEventListener('complete', ...)
eventSource.addEventListener('error', ...)   // ← 이 이벤트가 오지 않으면 상태 변경 없음
eventSource.onerror = ...                    // ← 네트워크 에러는 감지하지만 조용한 스트림 종료는 미감지
```

#### 필요한 처리

1. **클라이언트 타임아웃** — SSE 연결 후 N초(예: 60초) 이내에 `complete` 또는 `error` 이벤트가 오지 않으면 강제로 에러 상태로 전환
2. **`EventSource.onclose` 또는 `readyState` 감지** — 스트림이 조용히 닫혔을 때 에러 상태로 전환
3. **에러 UI** — "선택지 생성에 실패했습니다. 다시 시도해주세요." 메시지와 재시도 버튼 표시

#### 해결 방향 (제안)

```tsx
// 타임아웃 설정 예시
const timeout = setTimeout(() => {
  eventSource.close();
  setError('선택지 생성 시간이 초과되었습니다.');
}, 60_000);

// complete/error 수신 시 타임아웃 해제
eventSource.addEventListener('complete', () => {
  clearTimeout(timeout);
  // ...
});
```

---

## 흐름 요약

```
POST /generate-choices
  └─ SSE 200 시작
  └─ event:status {"phase":"generating"} 전송
  └─ [가상 스레드] AI 호출 → Gemini fallback
  └─ [가상 스레드] Sandbox 검증 → correctCount=2 → MULTIPLE_CORRECT
  └─ [가상 스레드] 재시도 3회 모두 실패
  └─ [가상 스레드] 에러 이벤트 전송 시도
       ├─ 성공 시 → 프론트 onError 수신 → 에러 UI 표시 (정상)
       └─ 실패/스트림 종료 시 → 프론트 로딩 상태 영구 유지 (버그 2)
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `server/.../ChoiceSetGenerationService.java` | AI 호출 + 샌드박스 검증 재시도 루프 |
| `server/.../SandboxValidator.java` | 선택지 실행 결과 비교 및 정답 판정 |
| `server/.../ChoiceSetResolver.java` | 정책별 선택지 생성 흐름 분기 |
| `server/.../ChoiceSetSaveService.java` | 성공/실패 선택지 세트 저장 |
| `client/src/pages/QuestionDetail.tsx` | SSE 수신 및 선택지 UI 렌더링 |
