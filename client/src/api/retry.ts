import { ApiError } from "./client";

export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 500) return false;
  return failureCount < 1;
}
