import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  SubmitResult,
  ExecuteResult,
  ProgressResponse,
  TopicTree,
  ConceptTag,
  AiResult,
  SimilarQuestion,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
  TodayQuestionResponse,
  RecommendationsResponse,
  GreetingResponse,
  ExamScheduleResponse,
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
  ChoiceItem,
} from "../types/api";

const MOCK_TOPICS: readonly TopicTree[] = [
  { code: "JOIN", displayName: "JOIN", subtopics: [{ code: "INNER_JOIN", displayName: "INNER JOIN" }, { code: "LEFT_JOIN", displayName: "LEFT JOIN" }] },
  { code: "SUBQUERY", displayName: "서브쿼리", subtopics: [] },
  { code: "GROUP_BY", displayName: "GROUP BY", subtopics: [] },
  { code: "DDL", displayName: "DDL", subtopics: [] },
  { code: "CONSTRAINT", displayName: "제약조건", subtopics: [] },
];

const MOCK_CHOICES: readonly ChoiceItem[] = [
  { key: "A", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 1 },
  { key: "B", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.cust_id\nGROUP BY c.name", sortOrder: 2 },
  { key: "C", kind: "SQL", body: "SELECT name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY name", sortOrder: 3 },
  { key: "D", kind: "SQL", body: "SELECT c.name, SUM(o.amount) AS total\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 4 },
];

const MOCK_QUESTIONS: readonly QuestionSummary[] = [
  // JOIN (2)
  { questionUuid: "q-uuid-0001", topicName: "JOIN", difficulty: 2, stemPreview: "고객별 주문 수를 구하는 올바른 SQL은?" },
  { questionUuid: "q-uuid-0006", topicName: "JOIN", difficulty: 3, stemPreview: "LEFT JOIN과 INNER JOIN의 결과 차이를 올바르게 설명한 것은?" },
  // 서브쿼리 (2)
  { questionUuid: "q-uuid-0002", topicName: "서브쿼리", difficulty: 3, stemPreview: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?" },
  { questionUuid: "q-uuid-0009", topicName: "서브쿼리", difficulty: 2, stemPreview: "상관 서브쿼리와 비상관 서브쿼리의 차이를 올바르게 설명한 것은?" },
  // GROUP BY (2)
  { questionUuid: "q-uuid-0003", topicName: "GROUP BY", difficulty: 2, stemPreview: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?" },
  { questionUuid: "q-uuid-0007", topicName: "GROUP BY", difficulty: 1, stemPreview: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?" },
  // DDL (2)
  { questionUuid: "q-uuid-0004", topicName: "DDL", difficulty: 1, stemPreview: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?" },
  { questionUuid: "q-uuid-0008", topicName: "DDL", difficulty: 2, stemPreview: "CREATE TABLE 시 DEFAULT 제약조건 문법은?" },
  // 제약조건 (2)
  { questionUuid: "q-uuid-0005", topicName: "제약조건", difficulty: 3, stemPreview: "NOT NULL과 UNIQUE 제약조건의 차이를 올바르게 설명한 것은?" },
  { questionUuid: "q-uuid-0010", topicName: "제약조건", difficulty: 1, stemPreview: "PRIMARY KEY와 UNIQUE 제약조건의 공통점과 차이점은?" },
];

const MOCK_QUESTION_DETAIL: QuestionDetail = {
  questionUuid: "q-uuid-0001",
  topicName: "JOIN",
  subtopicName: "INNER JOIN",
  difficulty: 2,
  executionMode: "EXECUTABLE",
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schemaDisplay: "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)",
};

const MOCK_PROGRESS: ProgressResponse = {
  solvedCount: 42,
  correctRate: 0.685,
  streakDays: 3,
};

const MOCK_TAGS: readonly ConceptTag[] = [
  { tagKey: "join", labelKo: "JOIN", category: "SQL", description: "테이블 결합", isActive: true, sortOrder: 1 },
  { tagKey: "group_by", labelKo: "GROUP BY", category: "SQL", description: "그룹 집계", isActive: true, sortOrder: 2 },
  { tagKey: "aggregate", labelKo: "집계함수", category: "SQL", description: "COUNT, SUM 등", isActive: true, sortOrder: 3 },
];

const MOCK_TODAY: TodayQuestionResponse = {
  question: MOCK_QUESTIONS[0],
  alreadySolvedToday: false,
};

const MOCK_RECOMMENDATIONS: RecommendationsResponse = {
  questions: MOCK_QUESTIONS.slice(0, 3),
};

const MOCK_GREETING: GreetingResponse = {
  message: "SQLD 시험까지 D-14! 오늘도 화이팅하세요",
};

const MOCK_EXAM_SCHEDULES: readonly ExamScheduleResponse[] = [
  { examScheduleUuid: "es-uuid-0001", certType: "SQLD", round: 1, examDate: "2026-05-10", isSelected: true },
  { examScheduleUuid: "es-uuid-0002", certType: "SQLD", round: 2, examDate: "2026-09-13", isSelected: false },
  { examScheduleUuid: "es-uuid-0003", certType: "SQLP", round: 1, examDate: "2026-06-21", isSelected: false },
];

interface ChoiceGenerationCallbacks {
  readonly onStatus: (status: ChoiceGenerationStatus) => void;
  readonly onComplete: (result: ChoiceSetComplete) => void;
  readonly onError: (error: ChoiceGenerationError) => void;
}

/** Mock SSE 시뮬레이션 — 타이머 기반 순서 재현. Returns cleanup function. */
export function generateChoicesMock(
  _questionUuid: string,
  callbacks: ChoiceGenerationCallbacks,
): () => void {
  let aborted = false;

  const t1 = setTimeout(() => {
    if (aborted) return;
    callbacks.onStatus({ phase: "generating", message: "선택지 생성 중..." });
  }, 200);

  const t2 = setTimeout(() => {
    if (aborted) return;
    callbacks.onStatus({ phase: "validating", message: "SQL 실행 검증 중..." });
  }, 500);

  const t3 = setTimeout(() => {
    if (aborted) return;
    callbacks.onComplete({
      choiceSetId: `cs-mock-${Date.now()}`,
      choices: MOCK_CHOICES,
    });
  }, 800);

  return () => {
    aborted = true;
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
}

/** path + method → mock response 매핑 */
export function getMockResponse(path: string, method: string, body?: string): unknown {
  // GET /questions/today  (specific before generic /questions/:uuid)
  if (method === "GET" && path.startsWith("/questions/today")) {
    return MOCK_TODAY satisfies TodayQuestionResponse;
  }

  // GET /questions/recommendations  (specific before generic /questions/:uuid)
  if (method === "GET" && path.startsWith("/questions/recommendations")) {
    return MOCK_RECOMMENDATIONS satisfies RecommendationsResponse;
  }

  // GET /questions?...  (list — no second path segment)
  if (method === "GET" && path.startsWith("/questions") && !path.includes("/questions/")) {
    const url = new URLSearchParams(path.split("?")[1] ?? "");
    const page = Number(url.get("page") ?? 0);
    const size = Number(url.get("size") ?? 10);
    const topic = url.get("topic");
    const topicDisplayName = topic ? MOCK_TOPICS.find((t) => t.code === topic)?.displayName : undefined;
    const filtered = topicDisplayName ? MOCK_QUESTIONS.filter((q) => q.topicName === topicDisplayName) : topic ? [] : MOCK_QUESTIONS;
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

  // GET /questions/:uuid  (detail)
  if (method === "GET" && /^\/questions\/[^/?]+$/.test(path)) {
    return { ...MOCK_QUESTION_DETAIL, questionUuid: path.split("/")[2] } satisfies QuestionDetail;
  }

  // POST /questions/:uuid/execute
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

  // POST /questions/:uuid/submit
  if (method === "POST" && path.includes("/submit")) {
    const parsed = body ? JSON.parse(body) : {};
    const selectedKey = (parsed.selectedChoiceKey ?? parsed.selectedKey ?? "A") as string;
    const isCorrect = selectedKey === "A";
    return { isCorrect, correctKey: "A", rationale: "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다." } satisfies SubmitResult;
  }

  // GET /progress
  if (method === "GET" && path === "/progress") {
    return MOCK_PROGRESS satisfies ProgressResponse;
  }

  // GET /home/greeting
  if (method === "GET" && path.startsWith("/home/greeting")) {
    return MOCK_GREETING satisfies GreetingResponse;
  }

  // GET /exam-schedules/selected  (specific before /exam-schedules)
  if (method === "GET" && path.startsWith("/exam-schedules/selected")) {
    return MOCK_EXAM_SCHEDULES.find((s) => s.isSelected) ?? null;
  }

  // GET /exam-schedules
  if (method === "GET" && path.startsWith("/exam-schedules")) {
    return MOCK_EXAM_SCHEDULES;
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

  // GET /ai/similar/:uuid
  if (method === "GET" && path.includes("/ai/similar/")) {
    return [
      { questionUuid: "q-uuid-0006", stem: "LEFT JOIN과 INNER JOIN의 결과 차이는?", topicName: "JOIN", score: 0.92 },
      { questionUuid: "q-uuid-0007", stem: "GROUP BY와 HAVING의 실행 순서는?", topicName: "GROUP BY", score: 0.85 },
    ] satisfies SimilarQuestion[];
  }

  return null;
}
