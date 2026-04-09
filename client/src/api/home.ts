import { apiFetch } from "./client";
import type { GreetingResponse } from "../types/api";

export function fetchGreeting(memberUuid: string): Promise<GreetingResponse> {
  return apiFetch(`/home/greeting?memberUuid=${memberUuid}`);
}
