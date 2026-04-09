// === Question ===
export type ExecutionMode = "EXECUTABLE" | "CONCEPT_ONLY";
export type ChoiceKind = "SQL" | "TEXT";

export interface QuestionSummary {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly difficulty: number;
  readonly stemPreview: string;
}

export interface ChoiceItem {
  readonly key: string;
  readonly kind: ChoiceKind;
  readonly body: string;
  readonly sortOrder: number;
}

export interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
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
export interface ProgressResponse {
  readonly solvedCount: number;
  readonly correctRate: number;
  readonly streakDays: number;
}

// === Heatmap ===
export interface HeatmapEntry {
  readonly date: string;
  readonly solvedCount: number;
  readonly correctCount: number;
}

export interface HeatmapResponse {
  readonly entries: readonly HeatmapEntry[];
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
  readonly questionUuid: string;
  readonly stem: string;
  readonly topicName: string;
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
  readonly questionUuid: string;
  readonly sql: string;
  readonly errorMessage: string;
}

export interface DiffExplainPayload {
  readonly questionUuid: string;
  readonly selectedChoiceKey: string;
}

// === Today / Recommendations ===
export interface TodayQuestionResponse {
  readonly question: QuestionSummary | null;
  readonly alreadySolvedToday: boolean;
}

export interface RecommendationsResponse {
  readonly questions: readonly QuestionSummary[];
}

// === Home ===
export interface GreetingResponse {
  readonly message: string;
}

// === ExamSchedule ===
export interface ExamScheduleResponse {
  readonly examScheduleUuid: string;
  readonly certType: string;
  readonly round: number;
  readonly examDate: string;
  readonly isSelected: boolean;
}

// === Practice ===
export interface PracticeQuestionResult {
  readonly questionUuid: string;
  readonly isCorrect: boolean;
  readonly selectedChoiceKey: string;
  readonly durationMs: number;
}

export interface PracticeSubmitPayload {
  readonly topicCode: string;
  readonly results: readonly PracticeQuestionResult[];
}

export interface PracticeAnalysis {
  readonly correctCount: number;
  readonly totalCount: number;
  readonly totalDurationMs: number;
  readonly greeting: string;
  readonly analysis: string;
  readonly tip: string;
}

