import { apiFetch } from './client';

// 신고 카테고리 — 백엔드 enum과 1:1 대응
export type ReportCategory =
  | 'WRONG_ANSWER'
  | 'WEIRD_QUESTION'
  | 'WEIRD_CHOICES'
  | 'WEIRD_EXECUTION'
  | 'ETC';

export interface ReportRequest {
  choiceSetUuid?: string;
  submissionUuid: string;
  categories: ReportCategory[];
  detail?: string;
}

export interface ReportStatusResponse {
  reported: boolean;
}

/**
 * 문제 신고 제출
 * POST /api/questions/{questionUuid}/report
 */
export async function submitReport(
  questionUuid: string,
  memberUuid: string,
  request: ReportRequest,
): Promise<void> {
  // apiFetch가 Content-Type: application/json을 자동 주입하므로 별도 설정 불필요
  await apiFetch<void>(`/questions/${questionUuid}/report`, {
    method: 'POST',
    headers: { 'X-Member-UUID': memberUuid },
    body: JSON.stringify(request),
  });
}

/**
 * 해당 제출에 대한 신고 여부 조회
 * GET /api/questions/{questionUuid}/report/status?submissionUuid=...
 */
export async function getReportStatus(
  questionUuid: string,
  memberUuid: string,
  submissionUuid: string,
): Promise<ReportStatusResponse> {
  return apiFetch<ReportStatusResponse>(
    `/questions/${questionUuid}/report/status?submissionUuid=${submissionUuid}`,
    { headers: { 'X-Member-UUID': memberUuid } },
  );
}
