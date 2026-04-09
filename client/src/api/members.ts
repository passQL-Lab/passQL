import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
} from "../types/api";

export function register(): Promise<MemberRegisterResponse> {
  return apiFetch("/members/register", { method: "POST" });
}

export function fetchMe(): Promise<MemberMeResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/members/me?memberUuid=${uuid}`);
}

export function regenerateNickname(): Promise<NicknameRegenerateResponse> {
  const uuid = getMemberUuid();
  return apiFetch(`/members/me/regenerate-nickname?memberUuid=${uuid}`, {
    method: "POST",
  });
}
