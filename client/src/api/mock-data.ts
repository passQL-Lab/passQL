import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  ProgressSummary,
  HeatmapEntry,
  TopicTree,
  ConceptTag,
  AiResult,
  SimilarQuestion,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
} from "../types/api";

const MOCK_TOPICS: readonly TopicTree[] = [
  { code: "JOIN", displayName: "JOIN", subtopics: [{ code: "INNER_JOIN", displayName: "INNER JOIN" }, { code: "LEFT_JOIN", displayName: "LEFT JOIN" }] },
  { code: "SUBQUERY", displayName: "서브쿼리", subtopics: [] },
  { code: "GROUP_BY", displayName: "GROUP BY", subtopics: [] },
  { code: "DDL", displayName: "DDL", subtopics: [] },
  { code: "CONSTRAINT", displayName: "제약조건", subtopics: [] },
];

const MOCK_QUESTIONS: readonly QuestionSummary[] = [
  { id: 1, topicCode: "JOIN", difficulty: 2, stemPreview: "고객별 주문 수를 구하는 올바른 SQL은?", executionMode: "EXECUTABLE" },
  { id: 2, topicCode: "SUBQUERY", difficulty: 3, stemPreview: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?", executionMode: "EXECUTABLE" },
  { id: 3, topicCode: "GROUP_BY", difficulty: 2, stemPreview: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?", executionMode: "EXECUTABLE" },
  { id: 4, topicCode: "DDL", difficulty: 1, stemPreview: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?", executionMode: "CONCEPT_ONLY" },
  { id: 5, topicCode: "CONSTRAINT", difficulty: 3, stemPreview: "NOT NULL과 UNIQUE 제약조건의 차이를 올바르게 설명한 것은?", executionMode: "CONCEPT_ONLY" },
  { id: 6, topicCode: "JOIN", difficulty: 3, stemPreview: "LEFT JOIN과 INNER JOIN의 결과 차이를 올바르게 설명한 것은?", executionMode: "EXECUTABLE" },
  { id: 7, topicCode: "GROUP_BY", difficulty: 1, stemPreview: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?", executionMode: "CONCEPT_ONLY" },
  { id: 8, topicCode: "DDL", difficulty: 2, stemPreview: "CREATE TABLE 시 DEFAULT 제약조건 문법은?", executionMode: "CONCEPT_ONLY" },
];

const MOCK_QUESTION_DETAIL: QuestionDetail = {
  id: 1,
  topicCode: "JOIN",
  subtopicCode: "INNER_JOIN",
  difficulty: 2,
  executionMode: "EXECUTABLE",
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schemaDisplay: "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)",
  choices: [
    { key: "A", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 1 },
    { key: "B", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.cust_id\nGROUP BY c.name", sortOrder: 2 },
    { key: "C", kind: "SQL", body: "SELECT name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY name", sortOrder: 3 },
    { key: "D", kind: "SQL", body: "SELECT c.name, SUM(o.amount) AS total\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 4 },
  ],
};

const MOCK_PROGRESS: ProgressSummary = {
  solved: 42,
  correctRate: 68.5,
  streakDays: 3,
  readiness: {
    score: 0.52,
    accuracy: 0.685,
    coverage: 0.6,
    recency: 1.0,
    lastStudiedAt: new Date().toISOString(),
    recentAttemptCount: 42,
    coveredTopicCount: 3,
    activeTopicCount: 5,
    daysUntilExam: 30,
    toneKey: 'STEADY',
  },
};

const MOCK_HEATMAP: readonly HeatmapEntry[] = [
  { topicCode: "JOIN", topicName: "JOIN", solved: 12, correctRate: 85 },
  { topicCode: "SUBQUERY", topicName: "서브쿼리", solved: 8, correctRate: 42 },
  { topicCode: "GROUP_BY", topicName: "GROUP BY", solved: 10, correctRate: 91 },
  { topicCode: "DDL", topicName: "DDL", solved: 5, correctRate: 35 },
  { topicCode: "DML", topicName: "DML", solved: 7, correctRate: 68 },
  { topicCode: "CONSTRAINT", topicName: "제약조건", solved: 6, correctRate: 55 },
  { topicCode: "INDEX", topicName: "인덱스", solved: 3, correctRate: 28 },
  { topicCode: "WINDOW", topicName: "윈도우함수", solved: 2, correctRate: 12 },
  { topicCode: "WHERE", topicName: "WHERE", solved: 9, correctRate: 78 },
  { topicCode: "ORDER_BY", topicName: "ORDER BY", solved: 11, correctRate: 95 },
];

const MOCK_TAGS: readonly ConceptTag[] = [
  { tagKey: "join", labelKo: "JOIN", category: "SQL", description: "테이블 결합", isActive: true, sortOrder: 1 },
  { tagKey: "group_by", labelKo: "GROUP BY", category: "SQL", description: "그룹 집계", isActive: true, sortOrder: 2 },
  { tagKey: "aggregate", labelKo: "집계함수", category: "SQL", description: "COUNT, SUM 등", isActive: true, sortOrder: 3 },
];

/** path + method → mock response 매핑 */
export function getMockResponse(path: string, method: string, body?: string): unknown {
  // GET /questions?...
  if (method === "GET" && path.startsWith("/questions") && !path.includes("/questions/")) {
    const url = new URLSearchParams(path.split("?")[1] ?? "");
    const page = Number(url.get("page") ?? 0);
    const size = Number(url.get("size") ?? 10);
    const topic = url.get("topic");
    const filtered = topic ? MOCK_QUESTIONS.filter((q) => q.topicCode === topic) : MOCK_QUESTIONS;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    return {
      content,
      totalPages: Math.ceil(filtered.length / size),
      totalElements: filtered.length,
      number: page,
      size,
      first: page === 0,
      last: start + size >= filtered.length,
      empty: content.length === 0,
    } satisfies Page<QuestionSummary>;
  }

  // GET /questions/:id
  if (method === "GET" && /^\/questions\/\d+$/.test(path)) {
    return { ...MOCK_QUESTION_DETAIL, id: Number(path.split("/")[2]) } satisfies QuestionDetail;
  }

  // POST /questions/:id/execute
  if (method === "POST" && path.includes("/execute")) {
    const sql = body ? JSON.parse(body).sql as string : "";
    const hasError = sql.includes("cust_id");
    if (hasError) {
      return { status: "ERROR", columns: [], rows: [], rowCount: 0, elapsedMs: 0, errorCode: "SQL_SYNTAX", errorMessage: "Unknown column 'o.cust_id' in 'on clause'" } satisfies ExecuteResult;
    }
    return {
      status: "SUCCESS", columns: ["name", "cnt"], rows: [["홍길동", 2], ["김영희", 3], ["이철수", 1]], rowCount: 3, elapsedMs: 34, errorCode: null, errorMessage: null,
    } satisfies ExecuteResult;
  }

  // POST /questions/:id/submit
  if (method === "POST" && path.includes("/submit")) {
    const selectedKey = body ? JSON.parse(body).selectedKey as string : "A";
    const isCorrect = selectedKey === "A";
    return { isCorrect, correctKey: "A", rationale: "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다." } satisfies SubmitResult;
  }

  // GET /progress
  if (method === "GET" && path === "/progress") {
    return MOCK_PROGRESS satisfies ProgressSummary;
  }

  // GET /progress/heatmap
  if (method === "GET" && path === "/progress/heatmap") {
    return MOCK_HEATMAP;
  }

  // GET /meta/topics
  if (method === "GET" && path === "/meta/topics") {
    return MOCK_TOPICS;
  }

  // GET /meta/tags
  if (method === "GET" && path === "/meta/tags") {
    return MOCK_TAGS;
  }

  // POST /members/register
  if (method === "POST" && path === "/members/register") {
    return { memberUuid: "mock-uuid-1234-5678-abcd", nickname: "용감한 판다" } satisfies MemberRegisterResponse;
  }

  // GET /members/me
  if (method === "GET" && path.startsWith("/members/me")) {
    return { memberUuid: "mock-uuid-1234-5678-abcd", nickname: "용감한 판다", role: "USER", status: "ACTIVE", isTestAccount: false, createdAt: "2026-04-07T12:00:00", lastSeenAt: "2026-04-08T01:00:00" } satisfies MemberMeResponse;
  }

  // POST /members/me/regenerate-nickname
  if (method === "POST" && path.includes("/regenerate-nickname")) {
    return { nickname: "빠른 코끼리" } satisfies NicknameRegenerateResponse;
  }

  // POST /ai/explain-error
  if (method === "POST" && path === "/ai/explain-error") {
    return { text: "선택한 SQL에서 `o.cust_id`는 존재하지 않는 컬럼입니다.\n\n**올바른 참조:**\n`o.customer_id`를 사용해야 ORDERS 테이블의 외래키를 정확히 참조할 수 있습니다.\n\n```sql\nJOIN ORDERS o ON c.id = o.customer_id\n```", promptVersion: 1 } satisfies AiResult;
  }

  // POST /ai/diff-explain
  if (method === "POST" && path === "/ai/diff-explain") {
    return { text: "선택지 C가 오답인 이유를 분석해 보겠습니다.\n\n**문제점: GROUP BY 절의 컬럼 참조 오류**\n\n`GROUP BY name`은 표준 SQL에서 모호한 참조입니다. 여러 테이블을 조인할 때는 반드시 테이블 별칭을 명시해야 합니다.\n\n```sql\n-- 올바른 SQL\nGROUP BY c.name\n```", promptVersion: 1 } satisfies AiResult;
  }

  // GET /ai/similar/:id
  if (method === "GET" && path.includes("/ai/similar/")) {
    return [
      { id: 6, stem: "LEFT JOIN과 INNER JOIN의 결과 차이는?", topicCode: "JOIN", score: 0.92 },
      { id: 7, stem: "GROUP BY와 HAVING의 실행 순서는?", topicCode: "GROUP_BY", score: 0.85 },
    ] satisfies SimilarQuestion[];
  }

  return null;
}
