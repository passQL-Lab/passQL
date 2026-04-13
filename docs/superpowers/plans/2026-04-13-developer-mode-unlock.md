# Developer Mode Unlock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 화면의 개발자 섹션을 기본 숨김 처리하고, 앱 정보 버전 row를 5번 클릭하는 Easter Egg 방식으로만 잠금 해제되도록 변경한다.

**Architecture:** `Settings.tsx` 단일 파일만 수정한다. `devUnlocked` state, `clickCount` ref, `toastMsg` state를 추가하고 JSX를 조건부 렌더링으로 변경한다. daisyUI 5의 `toast` + `alert` 클래스 조합으로 toast UI를 구현한다.

**Tech Stack:** React 19, TypeScript, daisyUI 5, Tailwind CSS 4

---

## 변경 파일

| 파일 | 역할 |
|------|------|
| `client/src/pages/Settings.tsx` | state/ref 추가, 클릭 핸들러, 조건부 렌더링, toast JSX |

---

### Task 1: state/ref 추가 및 개발자 섹션 조건부 렌더링

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: `Settings.tsx` 상단 state/ref 선언부에 아래 3개를 추가한다**

`confirmClear` 선언 바로 아래에 추가:

```tsx
// 개발자 모드 잠금 해제 상태 (세션 한정 — localStorage에 저장하지 않음)
const [devUnlocked, setDevUnlocked] = useState(false);
// 앱 정보 클릭 횟수 (리렌더 불필요 → ref)
const clickCountRef = useRef(0);
// toast 메시지 (null이면 숨김)
const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);
const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: stagger 선언에서 s5, s6 인덱스를 devUnlocked 여부와 무관하게 유지한다**

현재 코드 그대로 유지 (변경 없음). 개발자 섹션이 숨겨져 있어도 stagger 인덱스는 미리 선언해둬야 Hook 순서가 깨지지 않는다.

- [ ] **Step 3: `useEffect` cleanup에 `toastTimerRef` 정리를 추가한다**

기존 cleanup:
```tsx
useEffect(() => {
  return () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  };
}, []);
```

변경 후:
```tsx
useEffect(() => {
  return () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  };
}, []);
```

- [ ] **Step 4: 개발자 섹션 JSX를 조건부 렌더링으로 변경한다**

기존:
```tsx
{/* ⑥ 개발자 도구 섹션 */}
<section className={`mt-6 ${s5.className}`}>
  <SettingsSection label="개발자">
    ...
  </SettingsSection>
</section>
```

변경 후:
```tsx
{/* ⑥ 개발자 도구 섹션 — 앱 정보 5번 클릭 시에만 노출 */}
{devUnlocked && (
  <section className={`mt-6 ${s5.className}`}>
    <SettingsSection label="개발자">
      <div className="bg-surface-card border border-border rounded-2xl">
        <SettingsRow
          label="localStorage 초기화"
          value={
            <p className="text-sm text-text-secondary">앱 데이터 전체 삭제 후 재시작</p>
          }
          action={
            <button
              type="button"
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                confirmClear
                  ? "bg-sem-error-light border-[#FCA5A5] text-sem-error-text"
                  : "bg-white border-[#FCA5A5] text-sem-error-text hover:bg-sem-error-light"
              }`}
              onClick={handleClearStorage}
            >
              {confirmClear ? "확인 후 초기화" : "초기화"}
            </button>
          }
          isLast
        />
      </div>
    </SettingsSection>
  </section>
)}
```

---

### Task 2: 앱 정보 클릭 핸들러 및 toast 유틸 함수 추가

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: toast 표시 헬퍼 함수를 추가한다**

`handleClearStorage` 함수 바로 위에 추가:

```tsx
// toast를 2초간 표시한다
const showToast = (text: string, type: "info" | "success" | "warning") => {
  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  setToastMsg({ text, type });
  toastTimerRef.current = setTimeout(() => setToastMsg(null), 2000);
};
```

- [ ] **Step 2: 앱 정보 클릭 핸들러를 추가한다**

`showToast` 바로 아래에 추가:

```tsx
// 앱 정보 버전 row 클릭 — 5번 누르면 개발자 모드 잠금 해제
const handleVersionClick = () => {
  // 이미 잠금 해제 상태면 무시
  if (devUnlocked) return;

  clickCountRef.current += 1;
  const remaining = 5 - clickCountRef.current;

  if (remaining === 2) {
    showToast("개발자 모드까지 2번 남았습니다", "info");
  } else if (remaining === 1) {
    showToast("개발자 모드까지 1번 남았습니다", "info");
  } else if (remaining <= 0) {
    showToast("개발자 모드가 활성화되었습니다", "success");
    setDevUnlocked(true);
  }
};
```

- [ ] **Step 3: `handleClearStorage` 1차 클릭 시 toast 경고를 추가한다**

기존:
```tsx
const handleClearStorage = () => {
  if (!confirmClear) {
    setConfirmClear(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
    return;
  }
  clearTimeout(confirmTimerRef.current!);
  localStorage.clear();
  window.location.reload();
};
```

변경 후:
```tsx
const handleClearStorage = () => {
  if (!confirmClear) {
    setConfirmClear(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
    // 1차 클릭: 데이터 손실 경고 toast
    showToast("초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로 시작됩니다. 되돌릴 수 없어요.", "warning");
    return;
  }
  clearTimeout(confirmTimerRef.current!);
  localStorage.clear();
  window.location.reload();
};
```

---

### Task 3: 앱 정보 버전 row에 클릭 이벤트 연결 및 toast JSX 추가

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: 앱 정보 섹션의 버전 row를 클릭 가능하게 변경한다**

기존:
```tsx
{/* ⑤ 앱 정보 섹션 */}
<section className={`mt-6 ${s4.className}`}>
  <SettingsSection label="앱 정보">
    <div className="bg-surface-card border border-border rounded-2xl">
      <SettingsRow
        label="버전"
        value={
          <p className="text-caption">{__APP_VERSION__}</p>
        }
        isLast
      />
    </div>
  </SettingsSection>
</section>
```

변경 후:
```tsx
{/* ⑤ 앱 정보 섹션 — 버전 row 5번 클릭 시 개발자 모드 잠금 해제 */}
<section className={`mt-6 ${s4.className}`}>
  <SettingsSection label="앱 정보">
    {/* 클릭 가능한 div로 감싸서 Easter Egg 클릭 감지 */}
    <div
      className="bg-surface-card border border-border rounded-2xl cursor-pointer select-none"
      onClick={handleVersionClick}
      role="button"
      aria-label="앱 정보"
    >
      <SettingsRow
        label="버전"
        value={
          <p className="text-caption">{__APP_VERSION__}</p>
        }
        isLast
      />
    </div>
  </SettingsSection>
</section>
```

- [ ] **Step 2: toast 렌더링 블록을 JSX 최하단(로고 section 아래)에 추가한다**

```tsx
      {/* toast — 개발자 모드 잠금 해제 / 초기화 경고 */}
      {toastMsg && (
        <div className="toast toast-bottom toast-center z-50">
          <div className={`alert ${
            toastMsg.type === "info"
              ? "alert-info"
              : toastMsg.type === "success"
              ? "alert-success"
              : "alert-warning"
          } text-sm`}>
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}
```

`</div>` (최상위 `py-6` div) 닫기 태그 바로 앞에 삽입한다.

- [ ] **Step 3: 변경된 전체 `Settings.tsx`가 TypeScript 오류 없이 컴파일되는지 확인한다**

```bash
cd D:/0-suh/project/passQL/client && npx tsc --noEmit 2>&1 | head -30
```

오류가 없으면 완료. 오류가 있으면 해당 줄을 확인하여 수정한다.

---

## Self-Review

**스펙 커버리지 체크:**

| 요구사항 | 구현 Task |
|----------|-----------|
| 개발자 섹션 기본 숨김 (`devUnlocked` state) | Task 1 Step 1, 4 |
| 버전 row 클릭 카운트 감지 (`clickCountRef`) | Task 2 Step 2 |
| 클릭별 toast 피드백 (3번/4번/5번) | Task 2 Step 2 |
| toast 2초 자동 소멸 | Task 2 Step 1 |
| daisyUI alert-info / alert-success / alert-warning | Task 3 Step 2 |
| toast-bottom toast-center 위치 | Task 3 Step 2 |
| 초기화 1차 클릭 warning toast | Task 2 Step 3 |
| 초기화 버튼 레이블 "확인 후 초기화" | Task 1 Step 4 |
| cleanup에 toastTimerRef 정리 | Task 1 Step 3 |
| 세션 한정 (localStorage 저장 안 함) | Task 1 Step 1 |

**Placeholder 없음 확인:** 모든 step에 실제 코드 포함됨.

**타입 일관성:** `toastMsg` 타입 `{ text: string; type: "info" | "success" | "warning" } | null` — Task 1에서 선언, Task 2~3에서 동일하게 사용.
