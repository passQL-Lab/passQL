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
  readonly error_message: string;
}

export interface DiffExplainPayload {
  readonly question_id: number;
  readonly selected_key: string;
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

// === AI 선택지 생성 SSE ===
export type ChoiceGenerationPhase = "generating" | "validating";

export interface ChoiceGenerationStatus {
  readonly phase: ChoiceGenerationPhase;
  readonly message: string;
}

export interface ChoiceSetComplete {
  readonly choiceSetId: string;
  readonly choices: readonly ChoiceItem[];
}

export interface ChoiceGenerationError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

export interface SubmitPayload {
  readonly choiceSetId: string;
  readonly selectedChoiceKey: string;
}
