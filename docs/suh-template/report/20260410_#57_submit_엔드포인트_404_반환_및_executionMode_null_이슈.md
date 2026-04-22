# submit 엔드포인트 404 반환 및 executionMode null 이슈

**이슈**: [#57](https://github.com/passQL-Lab/passQL/issues/57)

---

### 📌 작업 개요

프론트엔드 관점에서 두 가지 이슈를 점검하고 타입 불일치 문제를 수정.
- `POST /questions/{questionUuid}/submit` 404 반환 → 프론트 코드 정상, BE 배포 이슈
- `executionMode` 필드 null 반환 → TypeScript 타입이 null을 허용하지 않아 컴파일 위험 존재 → 타입 수정

---

### 🔍 문제 분석

#### 1. submit 엔드포인트 404
프론트 코드(`src/api/questions.ts`)의 `submitAnswer()` 함수는 이미 올바르게 구현되어 있음.

- 엔드포인트: `POST /questions/{questionUuid}/submit` ✅
- 인증 헤더: `X-Member-UUID` ✅
- 요청 body 필드명: `selectedChoiceKey` ✅ (구 `selectedKey` fallback 지원 종료 대응 완료)

404 원인은 프로덕션 서버 배포 누락으로, 백엔드 재배포로 해결.

#### 2. executionMode null
백엔드에서 AI 검수 경로로 생성된 문제에 `executionMode` 기본값 미설정으로 null 저장.
런타임에서는 `null === "EXECUTABLE"` → `false` 로 CONCEPT_ONLY처럼 동작하여 실제 오동작은 없으나,
TypeScript 타입 정의에서 null을 허용하지 않아 컴파일 경고/오류 가능성 존재.

---

### ✅ 구현 내용

#### executionMode 타입 nullable 처리
- **파일**: `client/src/types/api.ts`
- **변경 내용**: `QuestionSummary`, `QuestionDetail` 두 인터페이스의 `executionMode` 필드를 `ExecutionMode | null`로 변경
- **이유**: 백엔드에서 DB 마이그레이션 전까지 null이 내려올 수 있으므로 타입 수준에서 명시적으로 허용, 런타임 동작과 타입 정의 일치

```typescript
// 변경 전
readonly executionMode: ExecutionMode;

// 변경 후
readonly executionMode: ExecutionMode | null;
```

---

### 🔧 주요 변경사항 상세

#### null 처리 전략
별도의 런타임 분기 없이 기존 비교 로직(`executionMode === "EXECUTABLE"`)이 null-safe하게 동작.
- null → `false` → SQL 실행 버튼 미노출, CONCEPT_ONLY 동작 유지
- 백엔드 Flyway 마이그레이션(`UPDATE question SET execution_mode = 'CONCEPT_ONLY' WHERE execution_mode IS NULL`) 완료 후 null 데이터 자체가 제거될 예정

---

### 🧪 테스트 및 검증
- `npm run build` 통과 확인 (tsc 컴파일 오류 없음)
- `executionMode: null` 응답 수신 시 SQL 실행 버튼이 숨겨지는 동작 유지

### 📌 참고사항
- submit 404는 최신 BE 빌드 배포 후 재확인 필요
- DB에 null로 저장된 기존 데이터는 BE Flyway 마이그레이션으로 별도 보정 필요
- 프론트 변경 범위: 타입 파일 1개, 2라인 수정
