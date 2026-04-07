import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError } from "./client";

// globalThis.fetch mock
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiError", () => {
  it("stores status and body", () => {
    const err = new ApiError(404, { message: "Not Found" });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(404);
    expect(err.body).toEqual({ message: "Not Found" });
    expect(err.message).toBe("API Error 404");
  });

  it("stores null body when response is not JSON", () => {
    const err = new ApiError(500, null);
    expect(err.status).toBe(500);
    expect(err.body).toBeNull();
  });
});

describe("apiFetch", () => {
  it("returns parsed JSON on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    const result = await apiFetch<{ data: string }>("/test");
    expect(result).toEqual({ data: "test" });
  });

  it("sends Content-Type application/json by default", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("merges custom headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/test", {
      headers: { "X-User-UUID": "abc-123" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-User-UUID": "abc-123",
        }),
      }),
    );
  });

  it("throws ApiError on non-ok response with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: "validation error" }),
    });

    await expect(apiFetch("/test")).rejects.toThrow(ApiError);

    try {
      await apiFetch("/test");
    } catch (err) {
      // reset mock for second call
    }
  });

  it("throws ApiError with status and body", async () => {
    const body = { detail: "not found" };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(body),
    });

    try {
      await apiFetch("/test");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.body).toEqual(body);
    }
  });

  it("throws ApiError with null body when response JSON parse fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("invalid json")),
    });

    try {
      await apiFetch("/test");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.body).toBeNull();
    }
  });

  it("prepends BASE_URL to path", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/questions");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/questions");
  });

  it("passes POST method and body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await apiFetch("/submit", {
      method: "POST",
      body: JSON.stringify({ selectedKey: "A" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: '{"selectedKey":"A"}',
      }),
    );
  });

  it("aborts on timeout", async () => {
    mockFetch.mockImplementationOnce(
      () => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 50);
      }),
    );

    await expect(apiFetch("/slow")).rejects.toThrow();
  });
});
