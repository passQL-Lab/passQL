# 개발자 디버그 HUD FAB 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DEV 빌드 전용 개발자 모드 HUD를 구현한다 — Settings에서 토글 활성화 시 플로팅 FAB(Speed Dial)이 나타나고, API 로그 / AI 응답 디버거 / Zustand 스토어 뷰어 패널을 제공한다.

**Architecture:** `src/dev/` 폴더로 개발자 기능을 완전 분리한다. `DevProvider`가 활성화 상태와 API 로그를 관리하고, `apiFetch`가 후킹 콜백을 통해 로그를 주입한다. `App.tsx`는 `src/dev/index.ts`만 import하며, `import.meta.env.DEV`가 false이면 전체 렌더링을 건너뛴다.

**Tech Stack:** React 19, TypeScript, Zustand, daisyUI 5 (Speed Dial / FAB), Tailwind CSS 4, lucide-react

---

## 파일 구조

```
client/src/dev/
  index.ts                  ← 외부 re-export (App.tsx는 여기만 import)
  DevProvider.tsx           ← Context + devMode 활성화 상태 + API 로그 저장소
  DevFab.tsx                ← daisyUI Speed Dial FAB 컴포넌트
  hooks/
    useDevMode.ts           ← devMode sessionStorage 읽기/쓰기
    useApiLog.ts            ← API 로그 리스트 접근 훅
  panels/
    ApiLogPanel.tsx         ← API 호출 이력 패널
    AiDebugPanel.tsx        ← AI 응답 디버거 패널
    StorePanel.tsx          ← Zustand 스토어 스냅샷 패널

수정 파일:
  client/src/api/client.ts        ← apiFetch에 로그 후킹 콜백 연결
  client/src/pages/Settings.tsx   ← 개발자 모드 토글 row 추가
  client/src/App.tsx              ← DevProvider 마운트
```

---

### Task 1: DevProvider — 활성화 상태 + API 로그 저장소

**Files:**
- Create: `client/src/dev/hooks/useDevMode.ts`
- Create: `client/src/dev/DevProvider.tsx`
- Create: `client/src/dev/index.ts`

- [ ] **Step 1: useDevMode 훅 작성**

```typescript
// client/src/dev/hooks/useDevMode.ts
const DEV_MODE_KEY = "devMode";

export function useDevMode() {
  const [enabled, setEnabled] = React.useState(
    () => sessionStorage.getItem(DEV_MODE_KEY) === "1"
  );

  const toggle = () => {
    const next = !enabled;
    if (next) sessionStorage.setItem(DEV_MODE_KEY, "1");
    else sessionStorage.removeItem(DEV_MODE_KEY);
    setEnabled(next);
  };

  return { enabled, toggle };
}

export function isDevModeEnabled(): boolean {
  return sessionStorage.getItem(DEV_MODE_KEY) === "1";
}
```

- [ ] **Step 2: API 로그 타입 및 DevContext 작성**

```typescript
// client/src/dev/DevProvider.tsx
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { useDevMode } from "./hooks/useDevMode";

export interface ApiLogEntry {
  readonly id: number;
  readonly method: string;
  readonly path: string;
  readonly status: "pending" | "ok" | "error";
  readonly statusCode?: number;
  readonly durationMs?: number;
  readonly reqBody?: unknown;
  readonly resBody?: unknown;
  readonly startedAt: number;
}

interface DevContextValue {
  readonly devEnabled: boolean;
  readonly toggleDev: () => void;
  readonly logs: readonly ApiLogEntry[];
  readonly addLog: (entry: Omit<ApiLogEntry, "id">) => number;
  readonly updateLog: (id: number, patch: Partial<ApiLogEntry>) => void;
  readonly clearLogs: () => void;
}

const DevContext = createContext<DevContextValue | null>(null);

export function DevProvider({ children }: { readonly children: React.ReactNode }) {
  const { enabled: devEnabled, toggle: toggleDev } = useDevMode();
  const [logs, setLogs] = useState<readonly ApiLogEntry[]>([]);
  const idRef = useRef(0);

  const addLog = useCallback((entry: Omit<ApiLogEntry, "id">): number => {
    const id = ++idRef.current;
    setLogs((prev) => [{ ...entry, id }, ...prev].slice(0, 50)); // 최대 50건 유지
    return id;
  }, []);

  const updateLog = useCallback((id: number, patch: Partial<ApiLogEntry>) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <DevContext.Provider value={{ devEnabled, toggleDev, logs, addLog, updateLog, clearLogs }}>
      {children}
    </DevContext.Provider>
  );
}

export function useDevContext(): DevContextValue {
  const ctx = useContext(DevContext);
  if (!ctx) throw new Error("useDevContext must be used inside DevProvider");
  return ctx;
}
```

- [ ] **Step 3: index.ts 작성 (외부 공개 인터페이스)**

```typescript
// client/src/dev/index.ts
export { DevProvider, useDevContext } from "./DevProvider";
export type { ApiLogEntry } from "./DevProvider";
export { useDevMode, isDevModeEnabled } from "./hooks/useDevMode";
```

- [ ] **Step 4: App.tsx에 DevProvider 마운트**

`client/src/App.tsx`에서 import 추가 후 RouterProvider를 DevProvider로 감싼다:

```typescript
// App.tsx 상단 import 추가
import { DevProvider } from "./dev/index";

// App 함수 수정
export default function App() {
  if (!import.meta.env.DEV) {
    return <RouterProvider router={router} />;
  }
  return (
    <DevProvider>
      <RouterProvider router={router} />
    </DevProvider>
  );
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL-Worktree/20260427_314_기능추가_개발자모드_디버그_HUD_FAB_구현/client
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add client/src/dev/ client/src/App.tsx
git commit -m "개발자 디버그 HUD FAB 구현 : feat : DevProvider context 및 API 로그 저장소 구현 https://github.com/passQL-Lab/passQL/issues/314"
```

---

### Task 2: apiFetch 후킹 — 로그를 DevProvider로 전달

**Files:**
- Create: `client/src/dev/hooks/useApiLog.ts`
- Modify: `client/src/api/client.ts`

- [ ] **Step 1: 전역 로그 콜백 레지스트리 작성**

`client.ts`에 콜백 등록/해제 인터페이스를 추가한다. DevProvider가 마운트될 때 등록하고 언마운트 시 해제한다.

```typescript
// client/src/api/client.ts 상단에 추가 (기존 import 아래)

type LogHook = (
  type: "req" | "res" | "err",
  method: string,
  path: string,
  data?: unknown,
  meta?: { durationMs?: number; statusCode?: number; logId?: number }
) => number | void;

let _logHook: LogHook | null = null;

/** DEV 전용: 외부 로그 후킹 콜백 등록 */
export function registerApiLogHook(hook: LogHook): void {
  _logHook = hook;
}

/** DEV 전용: 로그 후킹 콜백 해제 */
export function unregisterApiLogHook(): void {
  _logHook = null;
}
```

- [ ] **Step 2: fetchOnce의 log() 호출 지점에 후킹 연결**

기존 `log()` 함수 수정 없이, `fetchOnce` 안에서 `_logHook` 호출을 추가한다.

`fetchOnce` 함수 내부를 아래와 같이 수정한다:

```typescript
async function fetchOnce<T>(
  path: string,
  options: RequestInit,
  accessToken: string | null,
): Promise<T> {
  const method = options.method ?? "GET";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken && !AUTH_PATHS.some((p) => path.startsWith(p))) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const reqBody = options.body ? JSON.parse(options.body as string) : undefined;
  log("REQ", method, path, reqBody);
  // DEV HUD: req 로그 등록, 반환된 id로 res/err 시 업데이트
  const logId = IS_DEV && _logHook
    ? (_logHook("req", method, path, reqBody) as number)
    : undefined;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const durationMs = Date.now() - startedAt;
      log("ERR", method, path, { status: res.status, body });
      if (IS_DEV && _logHook) _logHook("err", method, path, body, { durationMs, statusCode: res.status, logId });
      throw new ApiError(res.status, body);
    }

    const contentLength = res.headers.get("content-length");
    const hasBody = res.status !== 204 && contentLength !== "0";
    const data = hasBody ? ((await res.json()) as T) : (undefined as T);
    const durationMs = Date.now() - startedAt;
    log("RES", method, path, data);
    if (IS_DEV && _logHook) _logHook("res", method, path, data, { durationMs, statusCode: res.status, logId });
    return data;
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 3: useApiLog 훅 작성 — DevProvider에서 후킹 등록**

```typescript
// client/src/dev/hooks/useApiLog.ts
import { useEffect } from "react";
import { registerApiLogHook, unregisterApiLogHook } from "../../api/client";
import { useDevContext } from "../DevProvider";

/** DevProvider 내에서 apiFetch 로그를 자동 수집하는 훅 */
export function useApiLogCollector() {
  const { addLog, updateLog } = useDevContext();

  useEffect(() => {
    registerApiLogHook((type, method, path, data, meta) => {
      if (type === "req") {
        return addLog({
          method,
          path,
          status: "pending",
          reqBody: data,
          startedAt: Date.now(),
        });
      }
      if (type === "res" && meta?.logId !== undefined) {
        updateLog(meta.logId, {
          status: "ok",
          statusCode: meta.statusCode,
          durationMs: meta.durationMs,
          resBody: data,
        });
      }
      if (type === "err" && meta?.logId !== undefined) {
        updateLog(meta.logId, {
          status: "error",
          statusCode: meta.statusCode,
          durationMs: meta.durationMs,
          resBody: data,
        });
      }
    });
    return () => unregisterApiLogHook();
  }, [addLog, updateLog]);
}
```

- [ ] **Step 4: DevProvider에 useApiLogCollector 연결**

`DevProvider.tsx`의 `DevProvider` 함수 안에서 `useApiLogCollector()` 호출을 추가한다:

```typescript
// DevProvider.tsx 상단 import 추가
import { useApiLogCollector } from "./hooks/useApiLog";

// DevProvider 함수 내부 (useState 선언 아래) 추가
export function DevProvider({ children }: { readonly children: React.ReactNode }) {
  const { enabled: devEnabled, toggle: toggleDev } = useDevMode();
  const [logs, setLogs] = useState<readonly ApiLogEntry[]>([]);
  const idRef = useRef(0);

  // apiFetch 호출을 자동 수집 — 콜백은 addLog/updateLog 안정 참조에 의존
  // (useApiLogCollector를 여기서 바로 쓰면 순환 의존이 생기므로 인라인 등록)
  useEffect(() => {
    registerApiLogHook((type, method, path, data, meta) => {
      if (type === "req") {
        const id = ++idRef.current;
        setLogs((prev) => [{ id, method, path, status: "pending", reqBody: data, startedAt: Date.now() }, ...prev].slice(0, 50));
        return id;
      }
      if ((type === "res" || type === "err") && meta?.logId !== undefined) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === meta.logId
              ? { ...l, status: type === "res" ? "ok" : "error", statusCode: meta.statusCode, durationMs: meta.durationMs, resBody: data }
              : l
          )
        );
      }
    });
    return () => unregisterApiLogHook();
  }, []); // 마운트 시 1회 등록 — addLog/updateLog 대신 직접 setLogs 사용해 의존성 제거

  // ...나머지 동일
```

> 주의: useApiLog.ts는 이제 사용하지 않으므로 파일을 만들되 DevProvider 인라인 방식을 사용한다.

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add client/src/api/client.ts client/src/dev/
git commit -m "개발자 디버그 HUD FAB 구현 : feat : apiFetch 로그 후킹 콜백 연결 https://github.com/passQL-Lab/passQL/issues/314"
```

---

### Task 3: 세 개의 디버그 패널 구현

**Files:**
- Create: `client/src/dev/panels/ApiLogPanel.tsx`
- Create: `client/src/dev/panels/AiDebugPanel.tsx`
- Create: `client/src/dev/panels/StorePanel.tsx`

- [ ] **Step 1: ApiLogPanel 작성**

```typescript
// client/src/dev/panels/ApiLogPanel.tsx
import { useState } from "react";
import { useDevContext } from "../DevProvider";
import type { ApiLogEntry } from "../DevProvider";

function statusColor(entry: ApiLogEntry): string {
  if (entry.status === "pending") return "text-text-secondary";
  if (entry.status === "ok") return "text-sem-success";
  return "text-sem-error";
}

function MethodBadge({ method }: { readonly method: string }) {
  const color = method === "GET" ? "text-brand" : method === "POST" ? "text-sem-warning" : "text-text-secondary";
  return <span className={`font-mono text-xs font-bold ${color}`}>{method}</span>;
}

export function ApiLogPanel() {
  const { logs, clearLogs } = useDevContext();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-primary">API 로그 (최근 {logs.length}건)</span>
        <button type="button" onClick={clearLogs} className="text-xs text-text-caption hover:text-sem-error transition-colors">
          초기화
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        {logs.length === 0 && (
          <p className="text-xs text-text-caption text-center py-6">API 호출 없음</p>
        )}
        {logs.map((entry) => (
          <div key={entry.id} className="border-b border-border last:border-0">
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-surface transition-colors"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-center gap-2">
                <MethodBadge method={entry.method} />
                <span className="font-mono text-xs text-text-primary truncate flex-1">{entry.path}</span>
                <span className={`text-xs ${statusColor(entry)}`}>
                  {entry.status === "pending" ? "..." : `${entry.durationMs}ms`}
                </span>
                {entry.statusCode && (
                  <span className={`text-xs font-mono ${entry.status === "ok" ? "text-sem-success" : "text-sem-error"}`}>
                    {entry.statusCode}
                  </span>
                )}
              </div>
            </button>
            {expanded === entry.id && (
              <div className="px-3 pb-2 space-y-1">
                {entry.reqBody !== undefined && (
                  <div>
                    <p className="text-xs text-text-caption mb-0.5">Request</p>
                    <pre className="text-xs bg-surface-card border border-border rounded p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(entry.reqBody, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.resBody !== undefined && (
                  <div>
                    <p className="text-xs text-text-caption mb-0.5">Response</p>
                    <pre className="text-xs bg-surface-card border border-border rounded p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(entry.resBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: AiDebugPanel 작성**

AI 관련 로그만 필터링해서 보여준다 (`/ai/` 경로).

```typescript
// client/src/dev/panels/AiDebugPanel.tsx
import { useDevContext } from "../DevProvider";

export function AiDebugPanel() {
  const { logs } = useDevContext();
  const aiLogs = logs.filter((l) => l.path.startsWith("/ai/"));

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-primary">AI 응답 디버거 ({aiLogs.length}건)</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {aiLogs.length === 0 && (
          <p className="text-xs text-text-caption text-center py-6">AI API 호출 없음</p>
        )}
        {aiLogs.map((entry) => {
          const res = entry.resBody as Record<string, unknown> | undefined;
          return (
            <div key={entry.id} className="px-3 py-2 border-b border-border last:border-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sem-warning">POST</span>
                <span className="font-mono text-xs text-text-primary">{entry.path}</span>
                <span className={`text-xs ml-auto ${entry.status === "ok" ? "text-sem-success" : "text-sem-error"}`}>
                  {entry.durationMs !== undefined ? `${entry.durationMs}ms` : "..."}
                </span>
              </div>
              {res && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {res.promptVersion !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">promptVersion</p>
                      <p className="font-mono text-text-primary">{String(res.promptVersion)}</p>
                    </div>
                  )}
                  {res.inputTokens !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">inputTokens</p>
                      <p className="font-mono text-text-primary">{String(res.inputTokens)}</p>
                    </div>
                  )}
                  {res.outputTokens !== undefined && (
                    <div className="bg-surface-card border border-border rounded px-2 py-1">
                      <p className="text-text-caption">outputTokens</p>
                      <p className="font-mono text-text-primary">{String(res.outputTokens)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: StorePanel 작성**

```typescript
// client/src/dev/panels/StorePanel.tsx
import { useAuthStore } from "../../stores/authStore";
import { usePracticeStore } from "../../stores/practiceStore";

export function StorePanel() {
  // 전체 상태를 스냅샷으로 구독 — 변경 시 리렌더
  const auth = useAuthStore();
  const practice = usePracticeStore();

  const sections = [
    {
      name: "authStore",
      data: {
        memberUuid: auth.memberUuid,
        nickname: auth.nickname,
        hasAccessToken: !!auth.accessToken,
        hasRefreshToken: !!auth.refreshToken,
        isRefreshing: auth.isRefreshing,
      },
    },
    {
      name: "practiceStore",
      data: {
        sessionId: practice.sessionId,
        topicCode: practice.topicCode,
        currentIndex: practice.currentIndex,
        questionsCount: practice.questions.length,
        resultsCount: practice.results.length,
        startedAt: practice.startedAt,
      },
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {sections.map(({ name, data }) => (
        <div key={name} className="border-b border-border last:border-0">
          <p className="px-3 py-2 text-xs font-semibold text-text-primary bg-surface">{name}</p>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between px-3 py-1.5 border-t border-border">
              <span className="text-xs text-text-secondary font-mono">{key}</span>
              <span className="text-xs font-mono text-text-primary max-w-[60%] truncate text-right">
                {value === null ? "null" : value === undefined ? "undefined" : String(value)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: index.ts에 패널 re-export 추가**

```typescript
// client/src/dev/index.ts (기존 내용에 추가)
export { DevProvider, useDevContext } from "./DevProvider";
export type { ApiLogEntry } from "./DevProvider";
export { useDevMode, isDevModeEnabled } from "./hooks/useDevMode";
export { ApiLogPanel } from "./panels/ApiLogPanel";
export { AiDebugPanel } from "./panels/AiDebugPanel";
export { StorePanel } from "./panels/StorePanel";
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add client/src/dev/
git commit -m "개발자 디버그 HUD FAB 구현 : feat : ApiLogPanel, AiDebugPanel, StorePanel 구현 https://github.com/passQL-Lab/passQL/issues/314"
```

---

### Task 4: DevFab — daisyUI Speed Dial FAB + 패널 렌더링

**Files:**
- Create: `client/src/dev/DevFab.tsx`
- Modify: `client/src/dev/index.ts`

- [ ] **Step 1: DevFab 작성**

```typescript
// client/src/dev/DevFab.tsx
import { useState } from "react";
import { Terminal, Activity, Database, X, Bug } from "lucide-react";
import { useDevContext } from "./DevProvider";
import { ApiLogPanel } from "./panels/ApiLogPanel";
import { AiDebugPanel } from "./panels/AiDebugPanel";
import { StorePanel } from "./panels/StorePanel";

type PanelType = "api" | "ai" | "store";

const PANELS: { type: PanelType; icon: React.ReactNode; label: string }[] = [
  { type: "api", icon: <Activity size={16} />, label: "API 로그" },
  { type: "ai", icon: <Terminal size={16} />, label: "AI 디버거" },
  { type: "store", icon: <Database size={16} />, label: "스토어" },
];

export function DevFab() {
  const { devEnabled } = useDevContext();
  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType | null>(null);

  // 개발자 모드 비활성화 시 렌더링 안 함
  if (!devEnabled) return null;

  const handleDialItem = (type: PanelType) => {
    setActivePanel(type);
    setOpen(false);
  };

  return (
    <>
      {/* Speed Dial FAB — 오른쪽 하단 고정, z-50 */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
        {/* Speed Dial 아이템 — open 시 위로 펼쳐짐 */}
        {open && PANELS.map(({ type, icon, label }) => (
          <div key={type} className="flex items-center gap-2">
            <span className="text-xs bg-[#1F2937] text-white px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
              {label}
            </span>
            <button
              type="button"
              className="btn btn-circle btn-sm bg-surface-card border border-border text-text-primary hover:bg-brand hover:text-white hover:border-brand shadow-md transition-colors"
              onClick={() => handleDialItem(type)}
            >
              {icon}
            </button>
          </div>
        ))}

        {/* 메인 FAB 버튼 */}
        <button
          type="button"
          className={`btn btn-circle shadow-lg transition-colors ${
            open ? "bg-[#1F2937] text-white border-[#1F2937]" : "bg-brand text-white border-brand"
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="개발자 HUD"
        >
          {open ? <X size={20} /> : <Bug size={20} />}
        </button>
      </div>

      {/* 패널 슬라이드업 오버레이 */}
      {activePanel && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-lg rounded-t-2xl"
          style={{ height: "50vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">
              {PANELS.find((p) => p.type === activePanel)?.label}
            </span>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-text-primary transition-colors rounded-lg hover:bg-surface"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-[calc(50vh-52px)] overflow-hidden">
            {activePanel === "api" && <ApiLogPanel />}
            {activePanel === "ai" && <AiDebugPanel />}
            {activePanel === "store" && <StorePanel />}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: index.ts에 DevFab re-export 추가**

```typescript
// client/src/dev/index.ts 전체 (최종본)
export { DevProvider, useDevContext } from "./DevProvider";
export type { ApiLogEntry } from "./DevProvider";
export { useDevMode, isDevModeEnabled } from "./hooks/useDevMode";
export { ApiLogPanel } from "./panels/ApiLogPanel";
export { AiDebugPanel } from "./panels/AiDebugPanel";
export { StorePanel } from "./panels/StorePanel";
export { DevFab } from "./DevFab";
```

- [ ] **Step 3: App.tsx에 DevFab 마운트**

```typescript
// App.tsx import 수정
import { DevProvider, DevFab } from "./dev/index";

export default function App() {
  if (!import.meta.env.DEV) {
    return <RouterProvider router={router} />;
  }
  return (
    <DevProvider>
      <RouterProvider router={router} />
      <DevFab />
    </DevProvider>
  );
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add client/src/dev/ client/src/App.tsx
git commit -m "개발자 디버그 HUD FAB 구현 : feat : DevFab Speed Dial 및 패널 오버레이 구현 https://github.com/passQL-Lab/passQL/issues/314"
```

---

### Task 5: Settings에 개발자 모드 토글 추가

**Files:**
- Modify: `client/src/pages/Settings.tsx`

- [ ] **Step 1: Settings.tsx에 토글 row 추가**

`Settings.tsx`의 "앱 정보" 섹션 아래에 개발자 모드 섹션을 추가한다. `import.meta.env.DEV`가 true일 때만 렌더링.

```typescript
// Settings.tsx 상단 import 추가
import { useDevContext } from "../dev/index";

// Settings 함수 내부 — 기존 state 선언 아래에 추가
const { devEnabled, toggleDev } = useDevContext();
```

"앱 정보" 섹션 `</section>` 바로 아래에 추가:

```tsx
{/* 개발자 모드 섹션 — DEV 빌드에서만 표시 */}
{import.meta.env.DEV && (
  <section>
    <SettingsSection label="개발자">
      <div className="bg-surface-card border-y border-border">
        <SettingsRow
          label="개발자 모드"
          value={
            <p className="text-sm text-text-secondary">
              {devEnabled ? "디버그 FAB 활성화됨" : "비활성화"}
            </p>
          }
          action={
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={devEnabled}
              onChange={toggleDev}
            />
          }
        />
      </div>
    </SettingsSection>
  </section>
)}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 3: client.ts 콘솔 log 제거 (HUD로 대체)**

`client.ts`의 `log()` 함수 — DEV HUD가 생겼으므로 콘솔 출력을 제거한다. `_logHook`이 등록된 경우에는 콘솔 출력을 건너뛴다:

```typescript
function log(label: string, method: string, path: string, data?: unknown) {
  if (!IS_DEV) return;
  // HUD 후킹이 활성화된 경우 콘솔 중복 출력 방지
  if (_logHook) return;
  const style = label === "REQ"
    ? "color:#4F46E5;font-weight:bold"
    : label === "RES"
      ? "color:#22C55E;font-weight:bold"
      : "color:#EF4444;font-weight:bold";
  console.groupCollapsed(`%c[API ${label}] ${method} ${path}`, style);
  if (data !== undefined) console.log(data);
  console.groupEnd();
}
```

- [ ] **Step 4: 최종 빌드 확인**

```bash
npm run build 2>&1 | tail -20
```
Expected: 에러 없이 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add client/src/pages/Settings.tsx client/src/api/client.ts
git commit -m "개발자 디버그 HUD FAB 구현 : feat : Settings 개발자 모드 토글 추가 및 콘솔 중복 출력 제거 https://github.com/passQL-Lab/passQL/issues/314"
```

---

## 셀프 리뷰

**Spec coverage 체크:**
- [x] Settings 개발자 모드 토글 → Task 5
- [x] sessionStorage devMode 플래그 → Task 1 useDevMode
- [x] DEV 빌드에서만 렌더링 → App.tsx `import.meta.env.DEV` 분기
- [x] daisyUI Speed Dial FAB → Task 4 DevFab
- [x] API 로그 패널 (req/res body 펼치기) → Task 3 ApiLogPanel
- [x] AI 응답 디버거 → Task 3 AiDebugPanel
- [x] Zustand 스토어 뷰어 → Task 3 StorePanel
- [x] src/dev/ 완전 분리 + index.ts re-export → Task 1~4
- [x] client.ts 콘솔 중복 출력 제거 → Task 5 Step 3

**Placeholder 없음** — 모든 단계에 실제 코드 포함됨.

**타입 일관성:**
- `ApiLogEntry.id: number` → Task 1 정의, Task 2 `_logHook` 반환값, Task 3 패널에서 `entry.id` key로 사용 — 일치
- `LogHook` 반환 타입 `number | void` → req 시 number 반환, 나머지 void — Task 2에서 일관되게 사용
- `useDevContext()` → Task 1 DevProvider에서 export, Task 3~5에서 import — 일치
