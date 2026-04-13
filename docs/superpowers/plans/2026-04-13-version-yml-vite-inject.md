# Version.yml Vite Inject Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `vite.config.ts`의 `__APP_VERSION__` 주입 소스를 `package.json`에서 `version.yml`로 교체해 설정 화면에 실제 릴리즈 버전이 표시되도록 한다.

**Architecture:** `vite.config.ts`에서 `readFileSync`로 레포 루트 `version.yml`을 읽고, 정규식으로 `version` 필드를 추출해 빌드 타임 상수 `__APP_VERSION__`에 주입한다. 추가 의존성 없음.

**Tech Stack:** Vite 8, TypeScript, Node.js `fs.readFileSync`, `import.meta.url` 기반 절대 경로

---

## 파일 구조

| 파일 | 변경 | 내용 |
|------|------|------|
| `client/vite.config.ts` | 수정 | `package.json` 읽기 → `version.yml` 읽기 + 정규식 파싱으로 교체 |

---

## Task 1: vite.config.ts 버전 소스 교체

**Files:**
- Modify: `client/vite.config.ts:1-13`

### 배경 지식

- 현재 `vite.config.ts` 9번 줄: `readFileSync`로 `./package.json`을 읽어 `pkg.version`을 `__APP_VERSION__`에 주입
- `version.yml` 위치: 레포 루트 (`client/vite.config.ts` 기준 `../../version.yml`)
- `import.meta.url` 기반 경로 패턴 이미 사용 중 — 동일 패턴으로 `version.yml` 경로 구성
- `version.yml`의 버전 라인 형식: `version: "0.0.115"` (항상 큰따옴표, 라인 시작)
- 정규식: `/^version:\s*"([^"]+)"/m` — 멀티라인 모드로 해당 라인 매칭, 그룹 1이 버전 문자열

- [ ] **Step 1: vite.config.ts 수정**

`client/vite.config.ts`의 `package.json` 읽기 블록(8~13번 줄)을 아래로 교체한다:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// version.yml을 직접 읽어 버전 추출 — package.json 동기화 문제 우회
// vite.config.ts 기준 ../../version.yml = 레포 루트 version.yml
const versionYml = readFileSync(
  fileURLToPath(new URL("../../version.yml", import.meta.url)),
  "utf-8",
);
const appVersion = versionYml.match(/^version:\s*"([^"]+)"/m)?.[1] ?? "0.0.0";

export default defineConfig({
  // version.yml의 version 값을 빌드 시 전역 상수로 주입
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: (process.env.VITE_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/api$/, ""),
        changeOrigin: true,
        // SSE 스트리밍 버퍼링 방지 — generate-choices 등 text/event-stream 응답이 즉시 전달되어야 함
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const ct = proxyRes.headers["content-type"] ?? "";
            if (ct.includes("text/event-stream")) {
              proxyRes.headers["x-accel-buffering"] = "no";
              proxyRes.headers["cache-control"] = "no-cache";
            }
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        global: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  },
});
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 버전 주입 값 확인**

```bash
cd client && npm run build 2>&1 | head -20
```

Expected: 빌드 성공, 에러 없음

빌드 후 `client/dist/assets/index-*.js`에서 버전 확인:

```bash
grep -o '"0\.0\.[0-9]*"' client/dist/assets/index-*.js | head -3
```

Expected: `"0.0.115"` (또는 현재 version.yml 버전값) 출력

---

## Self-Review

**Spec coverage 체크:**

| 요구사항 | 구현 태스크 |
|---------|------------|
| `package.json` 대신 `version.yml` 읽기 | Task 1 Step 1 |
| 정규식으로 버전 추출 | Task 1 Step 1 |
| 파싱 실패 시 `"0.0.0"` 폴백 | Task 1 Step 1 (`?? "0.0.0"`) |
| 빌드 정상 동작 확인 | Task 1 Step 3 |

**Placeholder scan:** 없음.

**Type consistency:** `appVersion: string` — `JSON.stringify(appVersion)`으로 일관되게 사용.
