import { getMockResponse } from "./mock-data";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TIMEOUT_MS = 25_000;
const IS_DEV = import.meta.env.DEV;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";

  // Mock mode: return mock data without network request
  if (USE_MOCK) {
    log("MOCK", method, path);
    await new Promise((r) => setTimeout(r, 200)); // simulate latency
    const mock = getMockResponse(path, method, options.body as string | undefined);
    if (mock !== null) {
      log("RES", method, path, mock);
      return mock as T;
    }
    console.warn(`[MOCK MISS] ${method} ${path} — mock 핸들러 없음, 실제 API로 fallthrough`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  log("REQ", method, path, options.body ? JSON.parse(options.body as string) : undefined);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      log("ERR", method, path, { status: res.status, body });
      throw new ApiError(res.status, body);
    }

    const data = (await res.json()) as T;
    log("RES", method, path, data);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    log("ERR", method, path, err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
