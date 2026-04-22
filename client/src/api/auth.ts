import { apiFetch } from "./client";

export type AuthProvider = "GOOGLE" | "KAKAO" | "NAVER" | "APPLE" | "GITHUB";

export interface LoginRequest {
  readonly authProvider: AuthProvider;
  readonly idToken: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly isNewMember: boolean;
  readonly memberUuid: string;
  readonly nickname: string;
}

export interface ReissueRequest {
  readonly refreshToken: string;
}

export interface ReissueResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export function login(req: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function reissue(req: ReissueRequest): Promise<ReissueResponse> {
  return apiFetch<ReissueResponse>("/auth/reissue", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
