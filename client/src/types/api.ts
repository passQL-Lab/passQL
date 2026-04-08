// === Question ===
export type ExecutionMode = "EXECUTABLE" | "CONCEPT_ONLY";
export type ChoiceKind = "SQL" | "TEXT";

export interface QuestionSummary {
  readonly id: number;
  readonly topicCode: string;
  readonly difficulty: number;
  readonly stemPreview: string;
  readonly executionMode: ExecutionMode;
}

export interface ChoiceItem {
  readonly key: string;
  readonly kind: ChoiceKind;
  readonly body: string;
  readonly sortOrder: number;
}

export interface QuestionDetail {
  readonly id: number;
  readonly topicCode: string;
  readonly subtopicCode: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  readonly choices: readonly ChoiceItem[];
}

export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
}

export interface ExecuteResult {
  readonly status: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly rowCount: number;
  readonly elapsedMs: number;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
}

// === Page ===
export interface Page<T> {
  readonly content: readonly T[];
  readonly totalPages: number;
  readonly totalElements: number;
  readonly number: number;
  readonly size: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly empty: boolean;
}

// === Progress ===
export interface ProgressSummary {
  readonly solved: number;
  readonly correctRate: number;
  readonly streakDays: number;
}

export interface HeatmapEntry {
  readonly topicCode: string;
  readonly topicName: string;
  readonly solved: number;
  readonly correctRate: number;
}

// === Meta ===
export interface SubtopicItem {
  readonly code: string;
  readonly displayName: string;
}

export interface TopicTree {
  readonly code: string;
  readonly displayName: string;
  readonly subtopics: readonly SubtopicItem[];
}

export interface ConceptTag {
  readonly tagKey: string;
  readonly labelKo: string;
  readonly category: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
}

// === AI ===
export interface AiResult {
  readonly text: string;
  readonly promptVersion: number;
}

export interface SimilarQuestion {
  readonly id: number;
  readonly stem: string;
  readonly topicCode: string;
  readonly score: number;
}

// === Member ===
export interface MemberRegisterResponse {
  readonly memberUuid: string;
  readonly nickname: string;
}

export interface MemberMeResponse {
  readonly memberUuid: string;
  readonly nickname: string;
  readonly role: string;
  readonly status: string;
  readonly isTestAccount: boolean;
  readonly createdAt: string;
  readonly lastSeenAt: string;
}

export interface NicknameRegenerateResponse {
  readonly nickname: string;
}

// === AI Payloads ===
export interface ExplainErrorPayload {
  readonly questionId: number;
  readonly sql: string;
  readonly errorMessage: string;
}

export interface DiffExplainPayload {
  readonly questionId: number;
  readonly selectedKey: string;
}
