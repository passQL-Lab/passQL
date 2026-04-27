// === Question ===
export type ExecutionMode = "EXECUTABLE" | "CONCEPT_ONLY";
export type ChoiceKind = "SQL" | "TEXT";
// AI_ONLY: 일반 AI 생성 / ODD_ONE_OUT: "결과가 다른 것은?" 유형 / CURATED_ONLY/HYBRID: 미구현
// RESULT_MATCH: "다음 SQL의 실행 결과로 올바른 것은?" 유형 — 선택지 body가 JSON 배열 결과 테이블
export type ChoiceSetPolicy = "AI_ONLY" | "ODD_ONE_OUT" | "CURATED_ONLY" | "HYBRID" | "RESULT_MATCH";

export interface QuestionSummary {
  readonly questionUuid: string;
  readonly topicCode: string;
  readonly topicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stemPreview: string;
  readonly createdAt: string;
}

export interface ChoiceItem {
  readonly key: string;
  readonly kind: ChoiceKind;
  readonly body: string;
  readonly isCorrect: boolean;
  readonly rationale: string;
  readonly sortOrder: number;
}

export type ChoiceSetSource =
  | "AI_RUNTIME"
  | "AI_PREFETCH"
  | "AI_ADMIN_PREVIEW"
  | "ADMIN_SEED"
  | "ADMIN_CURATED";

export type ChoiceSetStatus = "OK" | "DISABLED" | "REPORTED" | "DRAFT" | "FAILED";

export interface ChoiceSetSummary {
  readonly choiceSetUuid: string;
  readonly source: ChoiceSetSource;
  readonly status: ChoiceSetStatus;
  readonly sandboxValidationPassed: boolean;
  readonly createdAt: string;
  readonly items: readonly ChoiceItem[];
}

export interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly choiceSetPolicy: ChoiceSetPolicy;
  readonly stem: string;
  readonly schemaDisplay: string;
  readonly schemaDdl: string;
  readonly schemaSampleData: string;
  readonly schemaIntent: string;
  readonly answerSql: string;
  readonly hint: string;
  readonly choiceSets: readonly ChoiceSetSummary[];
}

export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  // EXECUTABLE 문제일 때만 non-null, CONCEPT_ONLY는 null
  readonly selectedResult: ExecuteResult | null;
  readonly correctResult: ExecuteResult | null;
  readonly selectedSql: string | null;
  readonly correctSql: string | null;
  // 신고 기능에 사용 — 백엔드 미지원 시 undefined
  readonly submissionUuid?: string;
}

// === SSE (선택지 생성) ===
export type SseStatusPhase = "generating" | "validating";

export interface SseStatusEvent {
  readonly phase: SseStatusPhase;
  readonly message: string;
}

export interface SseErrorEvent {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

export interface ChoiceSetGenerateResponse {
  readonly choiceSetId: string;
  // isCorrect, rationale은 사용자 정답 노출 방지를 위해 제외됨
  readonly choices: readonly ChoiceItem[];
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
export type ToneKey =
  | "NO_EXAM"
  | "ONBOARDING"
  | "POST_EXAM"
  | "TODAY"
  | "SPRINT"
  | "PUSH"
  | "STEADY"
  | "EARLY";

export interface ReadinessResponse {
  readonly score: number;
  readonly accuracy: number;
  readonly coverage: number;
  readonly recency: number;
  readonly retry: number;
  readonly spread: number;
  readonly lastStudiedAt: string | null;
  readonly recentAttemptCount: number;
  readonly coveredTopicCount: number;
  readonly activeTopicCount: number;
  readonly daysUntilExam: number | null;
  readonly toneKey: ToneKey;
}

export interface ProgressResponse {
  readonly solvedCount: number;
  readonly correctRate: number;
  readonly streakDays: number;
  readonly readiness: ReadinessResponse | null;
}

export interface CategoryStats {
  readonly code: string;
  readonly displayName: string;
  readonly correctRate: number;
  readonly solvedCount: number;
}

// === Topic Analysis (Issue #79) ===
export interface TopicStat {
  readonly topicUuid: string;
  readonly displayName: string;
  readonly totalQuestionCount: number;
  readonly correctRate: number;
  readonly solvedCount: number;
}

export interface TopicAnalysisResponse {
  readonly topicStats: readonly TopicStat[];
}

export interface AiCommentResponse {
  readonly comment: string;
  readonly generatedAt: string;
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
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface TopicTree {
  readonly topicUuid: string;
  readonly code: string;
  readonly displayName: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly subtopics: readonly SubtopicItem[];
}

export interface ConceptTag {
  readonly conceptTagUuid: string;
  readonly tagKey: string;
  readonly labelKo: string;
  readonly category: string;
  readonly description: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly updatedBy: string;
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

// 선택지 생성 모드
export type ChoiceGenerationMode = "PRACTICE" | "REAL";

export interface MemberMeResponse {
  readonly memberUuid: string;
  readonly nickname: string;
  readonly role: string;
  readonly status: string;
  readonly isTestAccount: boolean;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  // null이면 닉네임을 한 번도 변경하지 않은 상태
  readonly nicknameChangedAt: string | null;
  readonly choiceGenerationMode: ChoiceGenerationMode;
}

export interface NicknameRegenerateResponse {
  readonly nickname: string;
}

export interface NicknameCheckResponse {
  readonly available: boolean;
}

export interface NicknameChangeResponse {
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
export type GreetingMessageType = "GENERAL" | "EXAM_DAY" | "URGENT" | "COUNTDOWN";

export interface GreetingResponse {
  readonly nickname: string;
  readonly message: string;
  readonly messageType: GreetingMessageType;
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
  // 결과 화면에서 선택지 키(A/B/C/D) 대신 실제 선택지 텍스트를 보여주기 위해 저장
  readonly selectedChoiceBody: string;
  readonly durationMs: number;
  // 신고 기능에 사용 — 제출 시 서버가 반환한 UUID (백엔드 미지원 시 undefined)
  readonly submissionUuid?: string;
  // 신고 시 어떤 선택지 세트를 사용했는지 식별
  readonly choiceSetUuid?: string;
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

// === Feedback ===
export type FeedbackStatus = "PENDING" | "REVIEWED" | "APPLIED";

export interface FeedbackItem {
  readonly feedbackUuid: string;
  readonly content: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string; // ISO 8601
}

export interface FeedbackListResponse {
  readonly items: readonly FeedbackItem[];
}

export interface FeedbackSubmitResponse {
  readonly feedbackUuid: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string;
}

