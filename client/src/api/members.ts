import { apiFetch } from "./client";
import type {
  MemberMeResponse,
  NicknameRegenerateResponse,
} from "../types/api";

export function fetchMe(): Promise<MemberMeResponse> {
  return apiFetch("/members/me");
}

export function regenerateNickname(): Promise<NicknameRegenerateResponse> {
  return apiFetch("/members/me/regenerate-nickname", { method: "POST" });
}
