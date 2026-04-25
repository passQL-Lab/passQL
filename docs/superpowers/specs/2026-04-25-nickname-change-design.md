# 닉네임 변경 기능 설계

**작성일**: 2026-04-25  
**상태**: 승인됨

---

## 개요

현재 passQL은 닉네임을 랜덤 재생성만 할 수 있고 사용자가 원하는 닉네임으로 직접 변경할 수 없다. 이 문서는 사용자가 원하는 닉네임을 직접 입력·저장할 수 있는 기능의 설계를 정의한다.

---

## 요구사항

### 기능 요구사항
- 사용자가 원하는 닉네임을 직접 입력해서 변경할 수 있다
- 랜덤 생성(주사위) 버튼으로 자동 생성된 닉네임을 input에 채워서 선택할 수 있다
- 저장 전 중복확인을 반드시 거쳐야 한다 (저장 버튼은 중복확인 통과 전까지 비활성)
- 변경 후 3일간 재변경이 불가능하다 (쿨다운)

### 유효성 조건
- 허용 문자: 한글, 영문, 숫자만 (`^[가-힣a-zA-Z0-9]{2,10}$`)
- 길이: 2~10자
- 특수문자·띄어쓰기 불가
- 중복 닉네임 불가 (DB UNIQUE 제약)
- 욕설·금지어 필터링: 외부 라이브러리 사용 (백엔드)

### 쿨다운 처리
- 프론트는 별도 계산 없이 저장 시도 → 백엔드 에러 메시지(`NICKNAME_COOLDOWN`)를 토스트로 표시
- `GET /api/members/me`에 쿨다운 관련 필드 추가 없음

---

## DB 변경

`member` 테이블에 컬럼 1개 추가:

```sql
ALTER TABLE member
  ADD COLUMN nickname_changed_at DATETIME(6) NULL
  COMMENT '마지막 닉네임 변경 시각 (NULL이면 자동생성 상태)';
```

- `nickname_changed_at` NULL → 한 번도 직접 변경하지 않은 상태
- 변경 시 현재 시각으로 업데이트
- 쿨다운 체크: `NOW() < nickname_changed_at + INTERVAL 3 DAY`

---

## 백엔드 API

### 새 엔드포인트: 닉네임 중복 확인

```
GET /api/members/me/nickname/check?nickname={nickname}
```

- 인증: `X-Member-UUID` 헤더
- 응답: `{ "available": true }`
- 에러: 유효성 실패 시 400 `NICKNAME_INVALID`, 중복 시 409 `NICKNAME_DUPLICATED`

### 새 엔드포인트: 닉네임 직접 변경

```
PATCH /api/members/me/nickname
Body: { "nickname": "새싹개발자" }
```

- 인증: `X-Member-UUID` 헤더
- 응답: `{ "nickname": "새싹개발자" }`
- 에러 케이스:

| 상황 | HTTP | 에러코드 | 메시지 |
|------|------|----------|--------|
| 쿨다운 중 | 400 | `NICKNAME_COOLDOWN` | 변경 후 3일간 바꿀 수 없어요 |
| 중복 닉네임 | 409 | `NICKNAME_DUPLICATED` | 이미 사용 중인 닉네임이에요 |
| 유효성 실패 | 400 | `NICKNAME_INVALID` | 한글, 영문, 숫자만 사용 가능해요 (2~10자) |
| 금지어 감지 | 400 | `NICKNAME_FORBIDDEN` | 사용할 수 없는 닉네임이에요 |

### 유효성 검증 순서 (서버)
1. 길이 및 허용 문자 정규식 검증
2. 욕설·금지어 라이브러리 필터링
3. DB 중복 체크
4. 쿨다운 체크 (`nickname_changed_at`)

### 기존 `POST /api/members/me/regenerate-nickname`
- **변경 없음** — 쿨다운 미적용 (랜덤 재생성은 저장 없이 미리보기 역할)
- 랜덤 재생성 결과를 프론트 input에 채워주는 것뿐이며, 실제 저장은 PATCH로만 이루어짐

---

## 프론트엔드 UI

### 설정 페이지 닉네임 행

기존 새로고침 버튼을 **연필 아이콘**으로 교체. 클릭 시 닉네임 변경 모달(바텀시트) 오픈.

```
닉네임    풍요로운인형    [연필 아이콘]
```

### 닉네임 변경 모달 (바텀시트)

드래그 핸들 + 제목 "닉네임 변경" + X 버튼 구성.

```
─────────────────────────────
 닉네임 변경                  ×
 한글, 영문, 숫자만 · 2~10자
 변경 후 3일간 다시 바꿀 수 없어요

 [ 새싹개발자              ⊗ ] [🎲]

 닉네임을 입력하거나 주사위로 랜덤 생성해보세요

 [   중복확인   ] [   저장(비활성)   ]
─────────────────────────────
```

**상태별 UI:**

| 상태 | input 테두리 | 힌트 텍스트 | 저장 버튼 |
|------|-------------|------------|----------|
| 기본 | `#E5E7EB` | 안내 문구 | 비활성(`#E5E7EB`) |
| 중복확인 통과 | `#22C55E` | "사용할 수 있는 닉네임이에요" | 활성(`#4F46E5`) |
| 중복/에러 | `#EF4444` | 에러 메시지 | 비활성 |

**인터랙션:**
- 주사위(🎲) 버튼: `POST /api/members/me/regenerate-nickname` 호출 → 결과를 input에 채움 (저장 X, 중복확인 상태 초기화)
- ⊗ 버튼: input 내용 전체 삭제 (중복확인 상태 초기화)
- input 내용 변경 시: 중복확인 상태 초기화, 저장 버튼 비활성화
- 중복확인 버튼: `GET /api/members/me/nickname/check` 호출
- 저장 버튼: 중복확인 통과 후에만 활성. `PATCH /api/members/me/nickname` 호출
- 저장 성공: 모달 닫힘 + 토스트 "닉네임이 변경됐어요" + authStore `nickname` 업데이트
- 에러: 백엔드 에러 메시지 토스트로 표시

### 상태 관리
- `authStore`에 `nickname` 업데이트 (기존 필드 활용)
- 모달 open/close 상태는 Settings 컴포넌트 로컬 state로 관리

---

## 영향 범위

| 영역 | 변경 내용 |
|------|----------|
| DB | `member.nickname_changed_at` 컬럼 추가 (Flyway 마이그레이션) |
| 백엔드 | `GET /nickname/check`, `PATCH /nickname` 엔드포인트 신규 추가 |
| 백엔드 | `MemberService.changeNickname()` 메서드 추가 |
| 백엔드 | `ErrorCode` enum에 `NICKNAME_COOLDOWN`, `NICKNAME_INVALID`, `NICKNAME_FORBIDDEN` 추가 |
| 프론트 | `Settings.tsx` 닉네임 행 연필 아이콘으로 교체 + 모달 연동 |
| 프론트 | `NicknameChangeModal` 컴포넌트 신규 작성 |
| 프론트 | `src/api/members.ts`에 `checkNickname()`, `changeNickname()` 함수 추가 |
| 프론트 | `src/hooks/useMember.ts`에 관련 훅 추가 |
| 프론트 | `src/types/api.ts`에 요청/응답 타입 추가 |

---

## 미포함 사항

- 닉네임 변경 이력 보관 (별도 테이블 불필요)
- 관리자 금지어 관리 UI (라이브러리로 처리)
- 쿨다운 남은 시간 표시 (에러 메시지로 대체)
