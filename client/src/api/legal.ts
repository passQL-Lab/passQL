import { apiFetch } from "./client";

export type LegalType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";
export type LegalStatus = "PUBLISHED" | "DRAFT";

export interface LegalResponse {
  readonly type: LegalType;
  readonly title: string;
  readonly content: string;
  readonly status: LegalStatus;
}

export function fetchLegal(type: LegalType): Promise<LegalResponse> {
  return apiFetch<LegalResponse>(`/meta/legal/${type}`);
}
