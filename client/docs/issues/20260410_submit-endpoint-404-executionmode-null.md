<!-- 제목: 🔥 [긴급][API] submit 엔드포인트 404 반환 및 executionMode null 이슈 -->

## 📝 현재 문제점

### 1. `POST /questions/{questionUuid}/submit` 404 반환

Swagger 문서(#1, #22)에는 엔드포인트가 정의되어 있으나, 실제 프로덕션 서버에서 404를 반환함.

```
POST https://api.passql.suhsaechan.kr/api/questions/{questionUuid}/submit
→ 404 Not Found
```

**프론트 요청** (`src/api/questions.ts`):
```
Header: X-Member-UUID: {memberUuid}
Body:   { "selectedChoiceKey": "A" }
```

**추가로 확인된 사항 — Swagger Request Body 스키마 오류:**

Swagger UI에서 해당 엔드포인트의 Request body 스키마가 아래와 같이 잘못 표시됨:
```json
{
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```
`selectedChoiceKey` 필드가 스키마에 명시되지 않아 Spring의 `@RequestBody` 바인딩이 누락되었을 가능성 있음. 이 경우 요청 바디가 정상 파싱되지 않아 404 또는 400이 발생할 수 있음.

**기대 응답:**
```json
{
  "isCorrect": true,
  "correctKey": "A",
  "rationale": "정답 해설 텍스트"
}
```

현재 프론트는 404 catch 시 `isCorrect: false`로 폴백 처리하여 **항상 오답으로 표시**됨.

---

### 2. `executionMode` 필드가 `null`로 내려옴

`GET /questions/{questionUuid}` 응답에서 `executionMode` 필드가 `null`로 옴.

```json
{ "executionMode": null }
```

API 스펙상 허용 값은 `"EXECUTABLE"` | `"CONCEPT_ONLY"`. 프론트는 이 값으로 SQL 실행 버튼 노출 여부를 판단하는데, `null`이면 실행 버튼이 숨겨지고 선택지 자동 execute가 동작하지 않음.

---

## 🛠️ 해결 방안 / 제안 기능

1. **submit 엔드포인트 동작 확인:**
   - 프로덕션 서버 배포 여부 확인
   - Spring Controller `@RequestBody` DTO에 `selectedChoiceKey` 필드 명시 여부 확인
   - Swagger `@Schema` 어노테이션 추가하여 문서 스키마 정확히 노출

2. **`executionMode` null 처리:**
   - DB에 값이 없는 문제는 기본값 `"CONCEPT_ONLY"` 로 반환하도록 처리 요청

## 🙋‍♂️ 담당자

- 백엔드: 담당자
- 프론트엔드: @EM-H20
