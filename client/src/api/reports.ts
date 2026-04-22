import { apiFetch } from './client';

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

export async function submitReport(
  questionUuid: string,
  request: ReportRequest,
): Promise<void> {
  await apiFetch<void>(`/questions/${questionUuid}/report`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getReportStatus(
  questionUuid: string,
  submissionUuid: string,
): Promise<ReportStatusResponse> {
  return apiFetch<ReportStatusResponse>(
    `/questions/${questionUuid}/report/status?submissionUuid=${submissionUuid}`,
  );
}
