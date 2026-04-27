import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useDevMode } from "./hooks/useDevMode";
import { registerApiLogHook, unregisterApiLogHook } from "../api/client";

/** API 호출 1건의 로그 스냅샷 */
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
  readonly clearLogs: () => void;
}

const DevContext = createContext<DevContextValue | null>(null);

export function DevProvider({ children }: { readonly children: ReactNode }) {
  const { enabled: devEnabled, toggle: toggleDev } = useDevMode();
  const [logs, setLogs] = useState<readonly ApiLogEntry[]>([]);
  // 단조 증가 ID — ref이므로 리렌더 없이 증가
  const idRef = useRef(0);

  // apiFetch 호출을 자동 수집 — 마운트 시 1회 등록, 직접 setLogs 사용해 의존성 제거
  useEffect(() => {
    registerApiLogHook((type, method, path, data, meta) => {
      if (type === "req") {
        const id = ++idRef.current;
        setLogs((prev) =>
          // 최신 50건만 유지
          [{ id, method, path, status: "pending" as const, reqBody: data, startedAt: Date.now() }, ...prev].slice(0, 50)
        );
        return id;
      }
      if ((type === "res" || type === "err") && meta?.logId !== undefined) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === meta.logId
              ? {
                  ...l,
                  status: (type === "res" ? "ok" : "error") as "ok" | "error",
                  statusCode: meta.statusCode,
                  durationMs: meta.durationMs,
                  resBody: data,
                }
              : l
          )
        );
      }
    });
    return () => unregisterApiLogHook();
  }, []);

  const clearLogs = () => setLogs([]);

  return (
    <DevContext.Provider value={{ devEnabled, toggleDev, logs, clearLogs }}>
      {children}
    </DevContext.Provider>
  );
}

export function useDevContext(): DevContextValue {
  const ctx = useContext(DevContext);
  if (!ctx) throw new Error("useDevContext must be used inside DevProvider");
  return ctx;
}
