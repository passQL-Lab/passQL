import { getMockResponse } from "./mock-data";
import { getAccessToken, getRefreshToken, useAuthStore } from "../stores/authStore";
import { reissue } from "./auth";

// DEV 환경에서는 Vite 프록시(/api)를 사용하고, prod 환경에서는 실제 API 서버를 기본값으로 사용
export const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? "/api" : "https://api.passql.suhsaechan.kr/api");
const TIMEOUT_MS = 25_000;
const IS_DEV = import.meta.env.DEV;
// env 미설정 시 prod 기본값은 false
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "false") === "true";

// auth 관련 경로는 토큰 자동 주입 및 401 재시도에서 제외
const AUTH_PATHS = ["/auth/login", "/auth/reissue", "/auth/logout"];

function log(label: string, method: string, path: string, data?: unknown) {
  if (!IS_DEV) return;
  const style = label === "REQ"
    ? "color:#4F46E5;font-weight:bold"
    : label === "RES"
      ? "color:#22C55E;font-weight:bold"
      : "color:#EF4444;font-weight:bold";
  console.groupCollapsed(`%c[API ${label}] ${method} ${path}`, style);
  if (data !== undefined) console.log(data);
  console.groupEnd();
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API Error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function fetchOnce<T>(
  path: string,
  options: RequestInit,
  accessToken: string | null,
): Promise<T> {
  const method = options.method ?? "GET";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // 인증 경로가 아닌 경우에만 Bearer 토큰 주입
  if (accessToken && !AUTH_PATHS.some((p) => path.startsWith(p))) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  log("REQ", method, path, options.body ? JSON.parse(options.body as string) : undefined);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      log("ERR", method, path, { status: res.status, body });
      throw new ApiError(res.status, body);
    }

    // 204 No Content 또는 body가 없는 201 응답은 JSON 파싱 없이 반환
    const contentLength = res.headers.get("content-length");
    const hasBody = res.status !== 204 && contentLength !== "0";
    const data = hasBody ? ((await res.json()) as T) : (undefined as T);
    log("RES", method, path, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";

  // Mock mode: return mock data without network request
  if (USE_MOCK) {
    log("MOCK", method, path);
    await new Promise((r) => setTimeout(r, 200));
    const mock = getMockResponse(path, method, options.body as string | undefined);
    if (mock !== null) {
      log("RES", method, path, mock);
      return mock as T;
    }
    if (IS_DEV) console.warn(`[MOCK MISS] ${method} ${path} — mock 핸들러 없음, 실제 API로 fallthrough`);
  }

  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));

  try {
    return await fetchOnce<T>(path, options, getAccessToken());
  } catch (err) {
    // 인증 경로는 재시도 없음, 401이 아니면 그대로 throw
    if (isAuthPath || !(err instanceof ApiError) || err.status !== 401) {
      throw err;
    }

    // 401: refreshToken으로 재발급 시도
    const store = useAuthStore.getState();
    if (store.isRefreshing) {
      // 이미 갱신 중이면 잠시 후 현재 토큰으로 재시도
      await new Promise((r) => setTimeout(r, 500));
      return fetchOnce<T>(path, options, getAccessToken());
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) throw err;

    useAuthStore.setState({ isRefreshing: true });
    try {
      const result = await reissue({ refreshToken });
      store.setAccessToken(result.accessToken);
      // refreshToken도 갱신 (rotating refresh token)
      useAuthStore.setState({
        isRefreshing: false,
        refreshToken: result.refreshToken,
      });
      localStorage.setItem("passql_refresh_token", result.refreshToken);
      return fetchOnce<T>(path, options, result.accessToken);
    } catch {
      // refresh도 실패하면 로그아웃 처리
      store.clearTokens();
      useAuthStore.setState({ isRefreshing: false });
      window.location.href = "/login";
      throw err;
    }
  }
}

// ────────────────────────────────────────────────────────
// DevProvider가 API 호출 흐름을 가로채기 위한 hook 등록소
// Task 2에서 apiFetch 내부에 실제 호출 로직이 추가될 예정
// ────────────────────────────────────────────────────────
type LogHook = (
  type: "req" | "res" | "err",
  method: string,
  path: string,
  data?: unknown,
  meta?: { durationMs?: number; statusCode?: number; logId?: number }
) => number | void;

let _logHook: LogHook | null = null;

export function registerApiLogHook(hook: LogHook): void {
  // 중복 등록 시 개발 환경에서 경고 — 두 컴포넌트가 동시에 훅을 점유하는 버그를 조기 탐지
  if (import.meta.env.DEV && _logHook !== null) {
    console.warn("[DevMode] registerApiLogHook: 이미 등록된 hook을 덮어씁니다");
  }
  _logHook = hook;
}

export function unregisterApiLogHook(): void {
  _logHook = null;
}

/** 내부에서만 사용 — hook이 등록된 경우 호출 */
export function _callLogHook(
  type: "req" | "res" | "err",
  method: string,
  path: string,
  data?: unknown,
  meta?: { durationMs?: number; statusCode?: number; logId?: number }
): number | void {
  return _logHook?.(type, method, path, data, meta);
}
