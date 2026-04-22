import { apiFetch } from "./client";
import type { GreetingResponse } from "../types/api";

export function fetchGreeting(): Promise<GreetingResponse> {
  return apiFetch("/home/greeting");
}
