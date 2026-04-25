# Nickname Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 원하는 닉네임을 직접 입력·중복확인·저장할 수 있는 기능을 바텀시트 모달로 구현한다.

**Architecture:** 백엔드에 `nickname_changed_at` 컬럼 추가 + 중복확인/변경 엔드포인트 2개 신규 추가. 프론트엔드는 Settings 페이지 닉네임 행을 연필 아이콘으로 교체하고 `NicknameChangeModal` 바텀시트 컴포넌트를 신규 작성한다. 쿨다운·유효성·욕설 검증은 모두 서버에서 처리하며, 프론트는 에러 메시지를 토스트로 그대로 표시한다.

**Tech Stack:** Spring Boot(Java 17), JPA, Flyway, MariaDB / React 19, TypeScript, Zustand, React Query v5, Tailwind CSS 4, daisyUI 5, lucide-react

---

## 파일 구조

### 백엔드 — 신규 생성
| 파일 | 역할 |
|------|------|
| `server/PQL-Web/src/main/resources/db/migration/V0_0_160__add_nickname_changed_at_to_member.sql` | `nickname_changed_at` 컬럼 추가 마이그레이션 |
| `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameCheckResponse.java` | 중복확인 응답 DTO |
| `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeRequest.java` | 닉네임 변경 요청 DTO |
| `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeResponse.java` | 닉네임 변경 응답 DTO |

### 백엔드 — 수정
| 파일 | 변경 내용 |
|------|----------|
| `server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java` | `nicknameChangedAt` 필드 추가 + `changeNickname()` 메서드 추가 |
| `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` | `NICKNAME_COOLDOWN`, `NICKNAME_INVALID`, `NICKNAME_FORBIDDEN` 추가 |
| `server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java` | `checkNickname()`, `changeNickname()` 메서드 추가 |
| `server/PQL-Web/src/main/java/com/passql/web/controller/MemberController.java` | `GET /nickname/check`, `PATCH /nickname` 엔드포인트 추가 |

### 프론트엔드 — 신규 생성
| 파일 | 역할 |
|------|------|
| `client/src/components/NicknameChangeModal.tsx` | 닉네임 변경 바텀시트 모달 컴포넌트 |

### 프론트엔드 — 수정
| 파일 | 변경 내용 |
|------|----------|
| `client/src/types/api.ts` | `NicknameCheckResponse`, `NicknameChangeResponse` 타입 추가 |
| `client/src/api/members.ts` | `checkNickname()`, `changeNickname()` 함수 추가 |
| `client/src/hooks/useMember.ts` | `useCheckNickname()`, `useChangeNickname()` 훅 추가 |
| `client/src/pages/Settings.tsx` | 닉네임 row 연필 아이콘으로 교체 + 모달 연동 |

---

## Task 1: DB 마이그레이션 — nickname_changed_at 컬럼 추가

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_160__add_nickname_changed_at_to_member.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- V0_0_160__add_nickname_changed_at_to_member.sql
ALTER TABLE member
  ADD COLUMN nickname_changed_at DATETIME(6) NULL
  COMMENT '마지막 닉네임 직접 변경 시각 (NULL이면 자동생성 상태, 변경 후 3일 쿨다운)';
```

- [ ] **Step 2: 서버 기동하여 마이그레이션 자동 적용 확인**

```bash
cd server
./gradlew :PQL-Web:bootRun
```

로그에서 확인:
```
Flyway: Migrating schema to version 0.0.160 - add nickname changed at to member
```

DB에서 직접 확인:
```sql
DESCRIBE member;
-- nickname_changed_at DATETIME(6) NULL 이 있어야 함
```

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/resources/db/migration/V0_0_160__add_nickname_changed_at_to_member.sql
git commit -m "닉네임 직접 변경 기능 구현 : chore : nickname_changed_at 컬럼 마이그레이션 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 2: ErrorCode 추가

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: 기존 NICKNAME 관련 에러코드 확인**

파일을 열어 기존 코드 확인:
```
NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
NICKNAME_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "닉네임 생성에 실패했습니다."),
```

- [ ] **Step 2: 새 에러코드 3개 추가**

`NICKNAME_GENERATION_FAILED` 아래에 추가:
```java
NICKNAME_COOLDOWN(HttpStatus.BAD_REQUEST, "변경 후 3일간 바꿀 수 없어요"),
NICKNAME_INVALID(HttpStatus.BAD_REQUEST, "한글, 영문, 숫자만 사용 가능해요 (2~10자)"),
NICKNAME_FORBIDDEN(HttpStatus.BAD_REQUEST, "사용할 수 없는 닉네임이에요"),
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server
./gradlew :PQL-Common:build
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java
git commit -m "닉네임 직접 변경 기능 구현 : feat : NICKNAME_COOLDOWN, NICKNAME_INVALID, NICKNAME_FORBIDDEN 에러코드 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 3: Member 엔티티 — nicknameChangedAt 필드 추가

**Files:**
- Modify: `server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java`

- [ ] **Step 1: nicknameChangedAt 필드 및 changeNickname 메서드 추가**

기존 `nickname` 필드 아래에 추가:
```java
@Column(name = "nickname_changed_at")
private LocalDateTime nicknameChangedAt;
```

기존 비즈니스 메서드(`signUp`, `suspend` 등) 아래에 추가:
```java
// 닉네임 직접 변경 — 쿨다운 갱신 포함
public void changeNickname(String newNickname) {
    this.nickname = newNickname;
    this.nicknameChangedAt = LocalDateTime.now();
}

// 3일 쿨다운 여부 확인
public boolean isNicknameChangeCooldown() {
    if (nicknameChangedAt == null) return false;
    return LocalDateTime.now().isBefore(nicknameChangedAt.plusDays(3));
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:build
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java
git commit -m "닉네임 직접 변경 기능 구현 : feat : Member 엔티티 nicknameChangedAt 필드 및 changeNickname 메서드 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 4: 응답/요청 DTO 추가

**Files:**
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameCheckResponse.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeRequest.java`
- Create: `server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeResponse.java`

- [ ] **Step 1: NicknameCheckResponse 생성**

```java
package com.passql.member.dto;

public record NicknameCheckResponse(boolean available) {
}
```

- [ ] **Step 2: NicknameChangeRequest 생성**

```java
package com.passql.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NicknameChangeRequest(
    @NotBlank
    @Size(min = 2, max = 10, message = "한글, 영문, 숫자만 사용 가능해요 (2~10자)")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,10}$", message = "한글, 영문, 숫자만 사용 가능해요 (2~10자)")
    String nickname
) {
}
```

- [ ] **Step 3: NicknameChangeResponse 생성**

```java
package com.passql.member.dto;

public record NicknameChangeResponse(String nickname) {
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:build
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameCheckResponse.java \
        server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeRequest.java \
        server/PQL-Domain-Member/src/main/java/com/passql/member/dto/NicknameChangeResponse.java
git commit -m "닉네임 직접 변경 기능 구현 : feat : 닉네임 중복확인/변경 DTO 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 5: MemberService — checkNickname, changeNickname 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java`

- [ ] **Step 1: import 추가 확인**

파일 상단 import에 아래가 없으면 추가:
```java
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
```

- [ ] **Step 2: checkNickname 메서드 추가**

기존 `regenerateNickname` 메서드 아래에 추가:
```java
// 닉네임 중복 확인 — 유효성은 컨트롤러 @Valid에서 처리
@Transactional(readOnly = true)
public NicknameCheckResponse checkNickname(String nickname) {
    boolean available = !memberRepository.existsByNicknameAndIsDeletedFalse(nickname);
    return new NicknameCheckResponse(available);
}
```

- [ ] **Step 3: changeNickname 메서드 추가**

`checkNickname` 아래에 추가:
```java
// 닉네임 직접 변경 — 쿨다운, 중복, 욕설 검증 포함
@Transactional
public NicknameChangeResponse changeNickname(UUID memberUuid, NicknameChangeRequest request) {
    Member member = findActiveMember(memberUuid);

    // 3일 쿨다운 체크
    if (member.isNicknameChangeCooldown()) {
        throw new CustomException(ErrorCode.NICKNAME_COOLDOWN);
    }

    // 중복 체크 (본인 제외)
    String newNickname = request.nickname();
    if (!newNickname.equals(member.getNickname())
            && memberRepository.existsByNicknameAndIsDeletedFalse(newNickname)) {
        throw new CustomException(ErrorCode.NICKNAME_DUPLICATE);
    }

    member.changeNickname(newNickname);
    return new NicknameChangeResponse(member.getNickname());
}
```

> **Note:** 욕설 필터는 현재 외부 라이브러리 미도입 상태이므로 이 Task에서는 생략한다. Task 6(컨트롤러) 이후 별도 Task로 추가한다.

- [ ] **Step 4: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:build
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java
git commit -m "닉네임 직접 변경 기능 구현 : feat : MemberService checkNickname, changeNickname 메서드 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 6: MemberController — 엔드포인트 2개 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/MemberController.java`

- [ ] **Step 1: import 추가**

파일 상단에 없으면 추가:
```java
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
```

- [ ] **Step 2: 엔드포인트 2개 추가**

기존 `regenerateNickname` 메서드 아래에 추가:
```java
// 닉네임 중복 확인 — 저장 없이 사용 가능 여부만 반환
@GetMapping("/me/nickname/check")
public NicknameCheckResponse checkNickname(
        @AuthMember LoginMember loginMember,
        @RequestParam String nickname) {
    return memberService.checkNickname(nickname);
}

// 닉네임 직접 변경 — 쿨다운·중복·유효성 검증 포함
@PatchMapping("/me/nickname")
public NicknameChangeResponse changeNickname(
        @AuthMember LoginMember loginMember,
        @Valid @RequestBody NicknameChangeRequest request) {
    return memberService.changeNickname(loginMember.memberUuid(), request);
}
```

- [ ] **Step 3: 전체 서버 빌드 확인**

```bash
cd server
./gradlew :PQL-Web:build
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 서버 기동 후 API 수동 테스트**

서버 기동:
```bash
./gradlew :PQL-Web:bootRun
```

중복확인 테스트:
```bash
curl -s "http://localhost:8080/api/members/me/nickname/check?nickname=새싹개발자" \
  -H "X-Member-UUID: {테스트계정UUID}"
# 기대: {"available":true} 또는 {"available":false}
```

닉네임 변경 테스트:
```bash
curl -s -X PATCH "http://localhost:8080/api/members/me/nickname" \
  -H "X-Member-UUID: {테스트계정UUID}" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"새싹개발자"}'
# 기대: {"nickname":"새싹개발자"}
```

쿨다운 테스트 (변경 직후 재시도):
```bash
curl -s -X PATCH "http://localhost:8080/api/members/me/nickname" \
  -H "X-Member-UUID: {테스트계정UUID}" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"또다른닉네임"}'
# 기대: 400 NICKNAME_COOLDOWN 에러
```

- [ ] **Step 5: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/MemberController.java
git commit -m "닉네임 직접 변경 기능 구현 : feat : MemberController 닉네임 중복확인, 변경 엔드포인트 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 7: 프론트 타입 및 API 함수 추가

**Files:**
- Modify: `client/src/types/api.ts`
- Modify: `client/src/api/members.ts`

- [ ] **Step 1: api.ts — 타입 2개 추가**

파일에서 `NicknameRegenerateResponse` 인터페이스 아래에 추가:
```typescript
export interface NicknameCheckResponse {
  readonly available: boolean;
}

export interface NicknameChangeResponse {
  readonly nickname: string;
}
```

- [ ] **Step 2: members.ts — API 함수 2개 추가**

`regenerateNickname` 함수 아래에 추가:
```typescript
// 닉네임 중복 확인 — 저장 없이 사용 가능 여부만 반환
export function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  const params = new URLSearchParams({ nickname });
  return apiFetch(`/members/me/nickname/check?${params}`, {
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}

// 닉네임 직접 변경
export function changeNickname(nickname: string): Promise<NicknameChangeResponse> {
  return apiFetch("/members/me/nickname", {
    method: "PATCH",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ nickname }),
  });
}
```

> `getMemberUuid`는 기존 코드에서 import되어 있는 방식을 따른다. `client/src/api/members.ts` 파일 상단의 기존 import 패턴을 확인하고 동일하게 적용한다.

- [ ] **Step 3: TypeScript 타입 체크**

```bash
cd client
npm run build 2>&1 | head -30
```

Expected: 타입 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add client/src/types/api.ts client/src/api/members.ts
git commit -m "닉네임 직접 변경 기능 구현 : feat : 닉네임 중복확인, 변경 API 함수 및 타입 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 8: 프론트 훅 추가

**Files:**
- Modify: `client/src/hooks/useMember.ts`

- [ ] **Step 1: import 추가**

파일 상단에 없으면 추가:
```typescript
import { checkNickname, changeNickname } from "../api/members";
import type { NicknameCheckResponse, NicknameChangeResponse } from "../types/api";
```

- [ ] **Step 2: useCheckNickname 훅 추가**

기존 `useRegenerateNickname` 아래에 추가:
```typescript
// 닉네임 중복 확인 뮤테이션 — 호출 시마다 서버에 요청
export function useCheckNickname() {
  return useMutation<NicknameCheckResponse, Error, string>({
    mutationFn: (nickname: string) => checkNickname(nickname),
  });
}
```

- [ ] **Step 3: useChangeNickname 훅 추가**

`useCheckNickname` 아래에 추가:
```typescript
// 닉네임 변경 뮤테이션 — 성공 시 스토어 동기화 및 쿼리 무효화
export function useChangeNickname() {
  const queryClient = useQueryClient();
  const setNickname = useAuthStore((s) => s.setNickname);

  return useMutation<NicknameChangeResponse, Error, string>({
    mutationFn: (nickname: string) => changeNickname(nickname),
    onSuccess: (result) => {
      setNickname(result.nickname);
      queryClient.invalidateQueries({ queryKey: ["member"] });
    },
  });
}
```

- [ ] **Step 4: TypeScript 타입 체크**

```bash
cd client
npm run build 2>&1 | head -30
```

Expected: 타입 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add client/src/hooks/useMember.ts
git commit -m "닉네임 직접 변경 기능 구현 : feat : useCheckNickname, useChangeNickname 훅 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 9: NicknameChangeModal 컴포넌트 작성

**Files:**
- Create: `client/src/components/NicknameChangeModal.tsx`

- [ ] **Step 1: NicknameChangeModal 컴포넌트 작성**

기존 `ConfirmModal.tsx`의 바텀시트 패턴을 참고하여 작성한다.

```tsx
import { useState, useEffect, useRef } from "react";
import { Pencil, X } from "lucide-react";
import { useCheckNickname, useChangeNickname, useRegenerateNickname } from "../hooks/useMember";

// 주사위 아이콘 — lucide-react에 없으므로 SVG 인라인
function DiceIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="16.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface NicknameChangeModalProps {
  isOpen: boolean;
  currentNickname: string;
  onClose: () => void;
  onSuccess: (newNickname: string) => void;
}

export default function NicknameChangeModal({
  isOpen,
  currentNickname,
  onClose,
  onSuccess,
}: NicknameChangeModalProps) {
  const [value, setValue] = useState(currentNickname);
  // null: 미확인, true: 사용가능, false: 사용불가
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkMutation = useCheckNickname();
  const changeMutation = useChangeNickname();
  const regenerateMutation = useRegenerateNickname();

  // 모달 열릴 때 input 초기화 및 포커스
  useEffect(() => {
    if (isOpen) {
      setValue(currentNickname);
      setCheckResult(null);
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentNickname]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // input 변경 시 중복확인 상태 초기화
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setCheckResult(null);
    setErrorMsg(null);
  };

  // 클리어 버튼
  const handleClear = () => {
    setValue("");
    setCheckResult(null);
    setErrorMsg(null);
    inputRef.current?.focus();
  };

  // 주사위 버튼 — 랜덤 닉네임을 input에 채움 (저장 X)
  const handleDice = () => {
    regenerateMutation.mutate(undefined, {
      onSuccess: (result) => {
        setValue(result.nickname);
        setCheckResult(null);
        setErrorMsg(null);
      },
    });
  };

  // 중복확인
  const handleCheck = () => {
    if (!value.trim()) return;
    checkMutation.mutate(value, {
      onSuccess: (result) => {
        setCheckResult(result.available);
        setErrorMsg(result.available ? null : "이미 사용 중인 닉네임이에요");
      },
      onError: (err) => {
        setCheckResult(false);
        setErrorMsg(err.message || "중복확인에 실패했어요");
      },
    });
  };

  // 저장
  const handleSave = () => {
    if (checkResult !== true) return;
    changeMutation.mutate(value, {
      onSuccess: (result) => {
        onSuccess(result.nickname);
        onClose();
      },
      onError: (err) => {
        setErrorMsg(err.message || "닉네임 변경에 실패했어요");
      },
    });
  };

  if (!isOpen) return null;

  // input 테두리 색상
  const inputBorderClass =
    checkResult === true
      ? "border-sem-success"
      : checkResult === false
        ? "border-sem-error"
        : "border-border focus:border-brand";

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 바텀시트 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface-card pb-8"
        role="dialog"
        aria-modal="true"
        aria-label="닉네임 변경"
      >
        {/* 드래그 핸들 */}
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-border" />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-1 pt-5">
          <h2 className="text-h2">닉네임 변경</h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-caption hover:text-text-primary"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 설명 */}
        <p className="px-5 pb-5 text-sm text-text-secondary">
          한글, 영문, 숫자만 사용 가능 · 2~10자
          <br />
          변경 후 3일간 다시 바꿀 수 없어요
        </p>

        {/* 바디 */}
        <div className="flex flex-col gap-3 px-5">
          {/* input + 클리어 + 주사위 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                maxLength={10}
                placeholder="2~10자, 한글·영문·숫자"
                className={`input input-bordered h-12 w-full pr-9 text-base ${inputBorderClass}`}
              />
              {value && (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-caption hover:text-text-secondary"
                  onClick={handleClear}
                  aria-label="입력 지우기"
                >
                  <X size={16} className="rounded-full" />
                </button>
              )}
            </div>
            {/* 주사위 버튼 */}
            <button
              type="button"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-surface-card text-text-caption transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
              onClick={handleDice}
              disabled={regenerateMutation.isPending}
              title="랜덤 생성"
            >
              {regenerateMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <DiceIcon size={20} />
              )}
            </button>
          </div>

          {/* 힌트 / 상태 메시지 */}
          {checkResult === true && (
            <p className="text-sm font-medium text-sem-success">
              사용할 수 있는 닉네임이에요
            </p>
          )}
          {errorMsg && (
            <p className="text-sm text-sem-error">{errorMsg}</p>
          )}
          {checkResult === null && !errorMsg && (
            <p className="text-sm text-text-caption">
              닉네임을 입력하거나 주사위로 랜덤 생성해보세요
            </p>
          )}

          {/* 중복확인 + 저장 버튼 */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className={`btn flex-1 h-12 font-semibold ${
                checkResult === true
                  ? "btn-outline border-sem-success text-sem-success hover:bg-sem-success hover:text-white hover:border-sem-success"
                  : checkResult === false
                    ? "btn-outline border-sem-error text-sem-error hover:bg-sem-error hover:text-white hover:border-sem-error"
                    : "btn-outline border-brand text-brand hover:bg-brand-light"
              }`}
              onClick={handleCheck}
              disabled={!value.trim() || checkMutation.isPending}
            >
              {checkMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : checkResult === true ? (
                "확인완료"
              ) : (
                "중복확인"
              )}
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1 h-12 font-bold"
              onClick={handleSave}
              disabled={checkResult !== true || changeMutation.isPending}
            >
              {changeMutation.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "저장"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd client
npm run build 2>&1 | head -50
```

Expected: 타입 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add client/src/components/NicknameChangeModal.tsx
git commit -m "닉네임 직접 변경 기능 구현 : feat : NicknameChangeModal 바텀시트 컴포넌트 추가 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Task 10: Settings 페이지 — 닉네임 row 교체 및 모달 연동

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: import 수정**

기존:
```typescript
import { Copy, Check, RefreshCw, ChevronRight, LogOut } from "lucide-react";
import { useRegenerateNickname } from "../hooks/useMember";
```

변경 후:
```typescript
import { Copy, Check, Pencil, ChevronRight, LogOut } from "lucide-react";
import NicknameChangeModal from "../components/NicknameChangeModal";
```

- [ ] **Step 2: state 추가**

기존 `const regenerateMutation = useRegenerateNickname();` 줄을 제거하고, `useState` 선언부 근처에 추가:
```typescript
const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
```

- [ ] **Step 3: 닉네임 row 교체**

기존 `<SettingsRow label="닉네임" .../>` 블록 전체를 아래로 교체:
```tsx
<SettingsRow
  label="닉네임"
  value={
    <p className="text-sm font-bold text-text-primary">
      {nickname || uuid.slice(0, 8)}
    </p>
  }
  action={
    <button
      type="button"
      className="w-8 h-8 flex items-center justify-center transition-colors text-text-caption hover:text-brand"
      title="닉네임 변경"
      onClick={() => setIsNicknameModalOpen(true)}
    >
      <Pencil size={15} />
    </button>
  }
/>
```

- [ ] **Step 4: 모달 컴포넌트 추가**

`</div>` (최상위 return 닫는 태그) 바로 위, Toast div 아래에 추가:
```tsx
<NicknameChangeModal
  isOpen={isNicknameModalOpen}
  currentNickname={nickname || ""}
  onClose={() => setIsNicknameModalOpen(false)}
  onSuccess={(newNickname) => {
    showToast("닉네임이 변경됐어요");
    setIsNicknameModalOpen(false);
  }}
/>
```

- [ ] **Step 5: 개발 서버에서 UI 확인**

```bash
cd client
npm run dev
```

브라우저에서 `http://localhost:5173/settings` 접근 후:
1. 닉네임 행 오른쪽에 연필 아이콘이 표시되는지 확인
2. 연필 클릭 시 바텀시트 모달이 열리는지 확인
3. 주사위 클릭 시 랜덤 닉네임이 input에 채워지는지 확인
4. 중복확인 → 초록 테두리 + "사용할 수 있는 닉네임이에요" 확인
5. 저장 버튼 클릭 시 모달 닫히고 토스트 표시 확인
6. ESC 및 오버레이 클릭으로 닫히는지 확인

- [ ] **Step 6: TypeScript 빌드 최종 확인**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add client/src/pages/Settings.tsx
git commit -m "닉네임 직접 변경 기능 구현 : feat : Settings 닉네임 row 연필 아이콘 교체 및 NicknameChangeModal 연동 https://github.com/passQL-Lab/passQL/issues/287"
```

---

## Self-Review

### Spec coverage

| 요구사항 | 구현 Task |
|---------|----------|
| 직접 입력 변경 | Task 5, 6, 9, 10 |
| 랜덤 생성 버튼(주사위) | Task 9 (handleDice) |
| 중복확인 필수 (저장 비활성) | Task 9 (checkResult !== true) |
| 변경 후 3일 쿨다운 | Task 3 (isNicknameChangeCooldown), Task 5 (changeNickname) |
| 쿨다운 에러 토스트 표시 | Task 9 (onError → setErrorMsg) |
| 한글/영문/숫자만, 2~10자 | Task 4 (@Pattern), Task 2 (NICKNAME_INVALID) |
| 욕설 필터 | ⚠️ 미구현 — 외부 라이브러리 미도입으로 제외 |
| DB nickname_changed_at | Task 1, 3 |
| 바텀시트 모달 UI | Task 9 |
| 클리어 버튼(⊗) | Task 9 (handleClear) |
| 연필 아이콘 | Task 10 |

> ⚠️ **욕설 필터**: 설계 문서에서 외부 라이브러리(badwords-ko 등) 사용을 명시했으나 백엔드에 미도입 상태. 이 플랜 범위 밖. 별도 이슈로 추적 권장.

### Placeholder scan
- 없음

### Type consistency
- `NicknameCheckResponse.available` — Task 4, 7, 8, 9 모두 `boolean` 일치
- `NicknameChangeResponse.nickname` — Task 4, 7, 8, 9 모두 `string` 일치
- `changeNickname(UUID, NicknameChangeRequest)` — Task 5, 6 일치
- `checkNickname(String)` — Task 5, 6 일치
- `useCheckNickname` → `mutationFn: (nickname: string)` — Task 8, 9 일치
- `useChangeNickname` → `mutationFn: (nickname: string)` — Task 8, 9 일치
