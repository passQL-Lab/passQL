import { apiFetch } from "./client";
import { getMemberUuid } from "../stores/memberStore";
import type {
  MemberMeResponse,
  NicknameRegenerateResponse,
  NicknameCheckResponse,
  NicknameChangeResponse,
} from "../types/api";

export function fetchMe(): Promise<MemberMeResponse> {
  return apiFetch("/members/me");
}

export function regenerateNickname(): Promise<NicknameRegenerateResponse> {
  return apiFetch("/members/me/regenerate-nickname", { method: "POST" });
}

// 닉네임 중복 확인 — 저장 없이 사용 가능 여부만 반환
export function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  const params = new URLSearchParams({ nickname });
  return apiFetch(`/members/me/nickname/check?${params}`, {
    headers: { "X-Member-UUID": getMemberUuid() },
  });
}

// 닉네임 직접 변경
export function changeNickname(nickname: string): Promise<NicknameChangeResponse> {
  return apiFetch("/members/me/nickname", {
    method: "PATCH",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ nickname }),
  });
}
