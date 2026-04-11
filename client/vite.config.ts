/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

export default defineConfig({
  // package.json의 version을 빌드 시 전역 상수로 주입
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
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
