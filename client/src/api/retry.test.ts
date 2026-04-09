import { describe, it, expect } from "vitest";
import { shouldRetry } from "./retry";
import { ApiError } from "./client";

describe("shouldRetry", () => {
  it("returns false for 500 ApiError", () => {
    const err = new ApiError(500, null);
    expect(shouldRetry(0, err)).toBe(false);
  });

  it("returns false for 502 ApiError", () => {
    const err = new ApiError(502, null);
    expect(shouldRetry(0, err)).toBe(false);
  });

  it("returns true for 400 ApiError on first attempt", () => {
    const err = new ApiError(400, null);
    expect(shouldRetry(0, err)).toBe(true);
  });

  it("returns false for 400 ApiError on second attempt", () => {
    const err = new ApiError(400, null);
    expect(shouldRetry(1, err)).toBe(false);
  });

  it("returns true for network error on first attempt", () => {
    const err = new TypeError("Failed to fetch");
    expect(shouldRetry(0, err)).toBe(true);
  });

  it("returns false for network error on second attempt", () => {
    const err = new TypeError("Failed to fetch");
    expect(shouldRetry(1, err)).toBe(false);
  });
});
