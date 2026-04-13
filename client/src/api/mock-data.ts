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
  ChoiceItem,
  HeatmapResponse,
  CategoryStats,
} from "../types/api";

const MOCK_TOPICS: readonly TopicTree[] = [
  {
    topicUuid: "topic-uuid-001",
    code: "data_modeling",
    displayName: "데이터 모델링의 이해",
    sortOrder: 1,
    isActive: true,
    subtopics: [],
  },
  {
    topicUuid: "topic-uuid-002",
    code: "sql_basic_select",
    displayName: "SELECT 기본",
    sortOrder: 2,
    isActive: true,
    subtopics: [
      {
        code: "select_basic",
        displayName: "SELECT 문 구조",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "where_clause",
        displayName: "WHERE 절",
        sortOrder: 2,
        isActive: true,
      },
      {
        code: "order_by",
        displayName: "ORDER BY",
        sortOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-003",
    code: "sql_ddl_dml_tcl",
    displayName: "DDL / DML / TCL",
    sortOrder: 3,
    isActive: true,
    subtopics: [
      {
        code: "ddl",
        displayName: "DDL (CREATE/ALTER/DROP)",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "dml",
        displayName: "DML (INSERT/UPDATE/DELETE)",
        sortOrder: 2,
        isActive: true,
      },
      {
        code: "tcl",
        displayName: "TCL (COMMIT/ROLLBACK)",
        sortOrder: 3,
        isActive: true,
      },
      {
        code: "constraint",
        displayName: "제약조건",
        sortOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-004",
    code: "sql_function",
    displayName: "SQL 함수 (문자/숫자/날짜/NULL)",
    sortOrder: 4,
    isActive: true,
    subtopics: [
      {
        code: "string_func",
        displayName: "문자 함수",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "numeric_func",
        displayName: "숫자 함수",
        sortOrder: 2,
        isActive: true,
      },
      {
        code: "date_func",
        displayName: "날짜 함수",
        sortOrder: 3,
        isActive: true,
      },
      {
        code: "null_func",
        displayName: "NULL 관련 함수",
        sortOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-005",
    code: "sql_join",
    displayName: "조인 (JOIN)",
    sortOrder: 5,
    isActive: true,
    subtopics: [
      {
        code: "inner_join",
        displayName: "INNER JOIN",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "outer_join",
        displayName: "OUTER JOIN",
        sortOrder: 2,
        isActive: true,
      },
      {
        code: "self_join",
        displayName: "SELF JOIN",
        sortOrder: 3,
        isActive: true,
      },
      {
        code: "cross_join",
        displayName: "CROSS JOIN",
        sortOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-006",
    code: "sql_subquery",
    displayName: "서브쿼리",
    sortOrder: 6,
    isActive: true,
    subtopics: [
      {
        code: "scalar_subquery",
        displayName: "스칼라 서브쿼리",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "inline_view",
        displayName: "인라인 뷰",
        sortOrder: 2,
        isActive: true,
      },
      {
        code: "correlated_subquery",
        displayName: "상관 서브쿼리",
        sortOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-007",
    code: "sql_group_aggregate",
    displayName: "그룹함수 / 집계",
    sortOrder: 7,
    isActive: true,
    subtopics: [
      {
        code: "group_by",
        displayName: "GROUP BY",
        sortOrder: 1,
        isActive: true,
      },
      { code: "having", displayName: "HAVING", sortOrder: 2, isActive: true },
      {
        code: "aggregate_func",
        displayName: "집계 함수",
        sortOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-008",
    code: "sql_window",
    displayName: "윈도우 함수",
    sortOrder: 8,
    isActive: true,
    subtopics: [
      {
        code: "rank_func",
        displayName: "순위 함수 (RANK/ROW_NUMBER)",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "window_aggregate",
        displayName: "윈도우 집계",
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
  {
    topicUuid: "topic-uuid-009",
    code: "sql_hierarchy_pivot",
    displayName: "계층 쿼리 / PIVOT",
    sortOrder: 9,
    isActive: true,
    subtopics: [
      {
        code: "connect_by",
        displayName: "계층 쿼리 (CONNECT BY)",
        sortOrder: 1,
        isActive: true,
      },
      {
        code: "pivot",
        displayName: "PIVOT / UNPIVOT",
        sortOrder: 2,
        isActive: true,
      },
    ],
  },
];

// EXECUTABLE 문제 정답 실행 결과 (correctResult 용)
const MOCK_CORRECT_EXECUTE_RESULT: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [
    ["홍길동", 2],
    ["김영희", 3],
    ["이철수", 1],
  ],
  rowCount: 3,
  elapsedMs: 28,
  errorCode: null,
  errorMessage: null,
};

// EXECUTABLE 문제 오답 실행 결과 (selectedResult 용 — 오답 선택 시)
const MOCK_WRONG_EXECUTE_RESULT: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [
    ["홍길동", 5],
    ["김영희", 1],
  ],
  rowCount: 2,
  elapsedMs: 31,
  errorCode: null,
  errorMessage: null,
};

const MOCK_CHOICES: readonly ChoiceItem[] = [
  {
    key: "A",
    kind: "SQL",
    body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name",
    isCorrect: true,
    rationale:
      "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다.",
    sortOrder: 1,
  },
  {
    key: "B",
    kind: "SQL",
    body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.cust_id\nGROUP BY c.name",
    isCorrect: false,
    rationale: "cust_id는 존재하지 않는 컬럼입니다.",
    sortOrder: 2,
  },
  {
    key: "C",
    kind: "SQL",
    body: "SELECT name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY name",
    isCorrect: false,
    rationale: "GROUP BY name은 모호한 참조입니다.",
    sortOrder: 3,
  },
  {
    key: "D",
    kind: "SQL",
    body: "SELECT c.name, SUM(o.amount) AS total\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name",
    isCorrect: false,
    rationale: "SUM(amount)은 주문 수가 아닌 금액 합계입니다.",
    sortOrder: 4,
  },
];

const MOCK_QUESTIONS: readonly QuestionSummary[] = [
  // sql_join (2)
  {
    questionUuid: "q-uuid-0001",
    topicCode: "sql_join",
    topicName: "조인 (JOIN)",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "고객별 주문 수를 구하는 올바른 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0006",
    topicCode: "sql_join",
    topicName: "조인 (JOIN)",
    difficulty: 3,
    executionMode: "EXECUTABLE",
    stemPreview: "LEFT JOIN과 INNER JOIN의 결과 차이를 올바르게 설명한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_subquery (2)
  {
    questionUuid: "q-uuid-0002",
    topicCode: "sql_subquery",
    topicName: "서브쿼리",
    difficulty: 3,
    executionMode: "EXECUTABLE",
    stemPreview: "서브쿼리를 사용하여 평균 이상 주문한 고객을 조회하는 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0009",
    topicCode: "sql_subquery",
    topicName: "서브쿼리",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview:
      "상관 서브쿼리와 비상관 서브쿼리의 차이를 올바르게 설명한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_group_aggregate (2)
  {
    questionUuid: "q-uuid-0003",
    topicCode: "sql_group_aggregate",
    topicName: "그룹함수 / 집계",
    difficulty: 2,
    executionMode: "EXECUTABLE",
    stemPreview: "부서별 평균 급여가 500만원 이상인 부서를 구하는 SQL은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0007",
    topicCode: "sql_group_aggregate",
    topicName: "그룹함수 / 집계",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "GROUP BY와 HAVING의 실행 순서로 올바른 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_ddl_dml_tcl (2)
  {
    questionUuid: "q-uuid-0004",
    topicCode: "sql_ddl_dml_tcl",
    topicName: "DDL / DML / TCL",
    difficulty: 1,
    executionMode: "EXECUTABLE",
    stemPreview: "외래키 제약조건을 포함한 테이블 생성 SQL로 올바른 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0008",
    topicCode: "sql_ddl_dml_tcl",
    topicName: "DDL / DML / TCL",
    difficulty: 2,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "CREATE TABLE 시 DEFAULT 제약조건 문법은?",
    createdAt: "2026-04-07T12:00:00",
  },
  // sql_basic_select (2)
  {
    questionUuid: "q-uuid-0005",
    topicCode: "sql_basic_select",
    topicName: "SELECT 기본",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "SELECT 문의 실행 순서를 올바르게 나열한 것은?",
    createdAt: "2026-04-07T12:00:00",
  },
  {
    questionUuid: "q-uuid-0010",
    topicCode: "sql_basic_select",
    topicName: "SELECT 기본",
    difficulty: 1,
    executionMode: "CONCEPT_ONLY",
    stemPreview: "WHERE 절에서 LIKE 연산자의 와일드카드 사용법은?",
    createdAt: "2026-04-07T12:00:00",
  },
];

const MOCK_QUESTION_DETAIL: QuestionDetail = {
  questionUuid: "q-uuid-0001",
  topicName: "조인 (JOIN)",
  subtopicName: "INNER JOIN",
  difficulty: 2,
  executionMode: "CONCEPT_ONLY",
  choiceSetPolicy: "AI_ONLY",
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schemaDisplay:
    "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)",
  schemaDdl:
    "CREATE TABLE CUSTOMER (id INT PRIMARY KEY, name VARCHAR(50), email VARCHAR(100));\nCREATE TABLE ORDERS (id INT PRIMARY KEY, customer_id INT REFERENCES CUSTOMER(id), amount INT, order_date DATE);",
  schemaSampleData:
    "CUSTOMER: (1, '홍길동', 'hong@test.com'), (2, '김영희', 'kim@test.com')\nORDERS: (1, 1, 50000, '2026-01-01'), (2, 1, 30000, '2026-01-15'), (3, 2, 70000, '2026-02-01')",
  schemaIntent: "고객과 주문 테이블을 조인하여 고객별 주문 수를 집계",
  answerSql:
    "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.id = o.customer_id GROUP BY c.name",
  hint: "JOIN 조건에서 올바른 외래키 컬럼명을 확인하세요.",
  choiceSets: [
    {
      choiceSetUuid: "cs-uuid-0001",
      source: "ADMIN_SEED",
      status: "OK",
      sandboxValidationPassed: true,
      createdAt: "2026-04-07T12:00:00",
      items: MOCK_CHOICES,
    },
  ],
};

// MOCK_PROGRESS는 MOCK_CATEGORY_STATS 이후에 정의됨 (solvedCount 합산 일치)

const MOCK_TAGS: readonly ConceptTag[] = [
  {
    conceptTagUuid: "ct-uuid-001",
    tagKey: "join",
    labelKo: "JOIN",
    category: "SQL",
    description: "테이블 결합",
    isActive: true,
    sortOrder: 1,
    createdAt: "2026-04-07T12:00:00",
    updatedAt: "2026-04-07T12:00:00",
    createdBy: "admin",
    updatedBy: "admin",
  },
  {
    conceptTagUuid: "ct-uuid-002",
    tagKey: "group_by",
    labelKo: "GROUP BY",
    category: "SQL",
    description: "그룹 집계",
    isActive: true,
    sortOrder: 2,
    createdAt: "2026-04-07T12:00:00",
    updatedAt: "2026-04-07T12:00:00",
    createdBy: "admin",
    updatedBy: "admin",
  },
  {
    conceptTagUuid: "ct-uuid-003",
    tagKey: "aggregate",
    labelKo: "집계함수",
    category: "SQL",
    description: "COUNT, SUM 등",
    isActive: true,
    sortOrder: 3,
    createdAt: "2026-04-07T12:00:00",
    updatedAt: "2026-04-07T12:00:00",
    createdBy: "admin",
    updatedBy: "admin",
  },
];

const MOCK_TODAY: TodayQuestionResponse = {
  question: MOCK_QUESTIONS[0],
  alreadySolvedToday: false,
};

const MOCK_RECOMMENDATIONS: RecommendationsResponse = {
  questions: MOCK_QUESTIONS.slice(0, 3),
};

const MOCK_GREETING: GreetingResponse = {
  nickname: "용감한 판다",
  message: "{nickname}님, SQLD 시험까지 D-14! 오늘도 화이팅하세요",
  messageType: "COUNTDOWN",
};

const MOCK_EXAM_SCHEDULES: readonly ExamScheduleResponse[] = [
  {
    examScheduleUuid: "es-uuid-0001",
    certType: "SQLD",
    round: 1,
    examDate: "2026-05-10",
    isSelected: true,
  },
  {
    examScheduleUuid: "es-uuid-0002",
    certType: "SQLD",
    round: 2,
    examDate: "2026-09-13",
    isSelected: false,
  },
  {
    examScheduleUuid: "es-uuid-0003",
    certType: "SQLP",
    round: 1,
    examDate: "2026-06-21",
    isSelected: false,
  },
];

// MOCK_TOPICS에서 자동 생성 — 카테고리 수 일관성 유지
const MOCK_RATE_POOL = [0.82, 0.68, 0.41, 0.9, 0.55, 0.75, 0.33, 0.6, 0.2];
const MOCK_SOLVED_POOL = [45, 32, 18, 28, 22, 38, 12, 15, 5];
const MOCK_CATEGORY_STATS: readonly CategoryStats[] = MOCK_TOPICS.map(
  (t, i) => ({
    code: t.code,
    displayName: t.displayName,
    correctRate: MOCK_RATE_POOL[i % MOCK_RATE_POOL.length],
    solvedCount: MOCK_SOLVED_POOL[i % MOCK_SOLVED_POOL.length],
  }),
);

const MOCK_PROGRESS: ProgressResponse = {
  solvedCount: MOCK_CATEGORY_STATS.reduce((sum, c) => sum + c.solvedCount, 0),
  correctRate: 0.685,
  streakDays: 3,
  readiness: {
    score: 0.55,
    accuracy: 0.685,
    coverage: 0.75,
    recency: 0.82,
    difficulty: 0.50,
    retry: 0.80,
    spread: 0.70,
    lastStudiedAt: "2026-04-10T09:00:00",
    recentAttemptCount: 38,
    coveredTopicCount: 9,
    activeTopicCount: 12,
    daysUntilExam: 30,
    toneKey: "STEADY",
  },
};

function buildMockHeatmap(): HeatmapResponse {
  const pattern = [
    3, 0, 5, 2, 1, 0, 4, 6, 0, 1, 2, 3, 0, 0, 5, 1, 2, 0, 3, 4, 0, 1, 0, 6, 2,
    3, 1, 0, 4, 2,
  ];
  const entries = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const solved = pattern[29 - i];
    if (solved > 0) {
      const correct = Math.min(solved, Math.max(0, solved - 1));
      entries.push({
        date: dateStr,
        solvedCount: solved,
        correctCount: correct,
      });
    }
  }
  return { entries };
}

/** path + method → mock response 매핑 */
export function getMockResponse(
  path: string,
  method: string,
  body?: string,
): unknown {
  // GET /questions/today  (specific before generic /questions/:uuid)
  if (method === "GET" && path.startsWith("/questions/today")) {
    return MOCK_TODAY satisfies TodayQuestionResponse;
  }

  // GET /questions/recommendations  (specific before generic /questions/:uuid)
  if (method === "GET" && path.startsWith("/questions/recommendations")) {
    return MOCK_RECOMMENDATIONS satisfies RecommendationsResponse;
  }

  // GET /questions?...  (list — no second path segment)
  if (
    method === "GET" &&
    path.startsWith("/questions") &&
    !path.includes("/questions/")
  ) {
    const url = new URLSearchParams(path.split("?")[1] ?? "");
    const page = Number(url.get("page") ?? 0);
    const size = Number(url.get("size") ?? 10);
    const topic = url.get("topic");
    const filtered = topic
      ? MOCK_QUESTIONS.filter((q) => q.topicCode === topic)
      : MOCK_QUESTIONS;
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
    return {
      ...MOCK_QUESTION_DETAIL,
      questionUuid: path.split("/")[2],
    } satisfies QuestionDetail;
  }

  // POST /questions/:uuid/execute
  if (method === "POST" && path.includes("/execute")) {
    const sql = body ? (JSON.parse(body).sql as string) : "";
    const hasError = sql.includes("cust_id");
    if (hasError) {
      return {
        status: "ERROR",
        columns: [],
        rows: [],
        rowCount: 0,
        elapsedMs: 0,
        errorCode: "SQL_SYNTAX",
        errorMessage: "Unknown column 'o.cust_id' in 'on clause'",
      } satisfies ExecuteResult;
    }
    return {
      status: "SUCCESS",
      columns: ["name", "cnt"],
      rows: [
        ["홍길동", 2],
        ["김영희", 3],
        ["이철수", 1],
      ],
      rowCount: 3,
      elapsedMs: 34,
      errorCode: null,
      errorMessage: null,
    } satisfies ExecuteResult;
  }

  // POST /questions/:uuid/generate-choices
  if (method === "POST" && path.includes("/generate-choices")) {
    const questionUuid = path.split("/")[2];
    const matchedQuestion = MOCK_QUESTIONS.find(
      (q) => q.questionUuid === questionUuid,
    );
    const detail = { ...MOCK_QUESTION_DETAIL, questionUuid };
    const items = detail.choiceSets[0]?.items ?? [];
    return {
      choiceSetId: matchedQuestion
        ? `mock-cs-${questionUuid}`
        : "mock-cs-default",
      choices: items.map(({ key, kind, body, sortOrder }) => ({
        key,
        kind,
        body,
        sortOrder,
      })),
    };
  }

  // POST /questions/:uuid/submit
  if (method === "POST" && path.includes("/submit")) {
    const parsed = body ? JSON.parse(body) : {};
    const selectedKey = (parsed.selectedChoiceKey ?? "A") as string;
    const isCorrect = selectedKey === "A";
    const questionUuid = path.split("/")[2];

    // UUID로 MOCK_QUESTIONS에서 executionMode 조회 (없으면 CONCEPT_ONLY 폴백)
    const matchedQuestion = MOCK_QUESTIONS.find(
      (q) => q.questionUuid === questionUuid,
    );
    const executionMode = matchedQuestion?.executionMode ?? "CONCEPT_ONLY";

    if (executionMode === "EXECUTABLE") {
      return {
        isCorrect,
        correctKey: "A",
        rationale:
          "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다.",
        selectedSql: isCorrect
          ? "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.id = o.customer_id GROUP BY c.name"
          : "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.id = o.cust_id GROUP BY c.name",
        correctSql:
          "SELECT c.name, COUNT(*) AS cnt FROM CUSTOMER c JOIN ORDERS o ON c.id = o.customer_id GROUP BY c.name",
        selectedResult: isCorrect
          ? MOCK_CORRECT_EXECUTE_RESULT
          : MOCK_WRONG_EXECUTE_RESULT,
        correctResult: MOCK_CORRECT_EXECUTE_RESULT,
      } satisfies SubmitResult;
    }

    // CONCEPT_ONLY: SQL 실행 없이 정답 판별만 반환
    return {
      isCorrect,
      correctKey: "A",
      rationale:
        "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다.",
      selectedResult: null,
      correctResult: null,
      selectedSql: null,
      correctSql: null,
    } satisfies SubmitResult;
  }

  // GET /progress/categories (specific before /progress)
  if (method === "GET" && path.startsWith("/progress/categories")) {
    return MOCK_CATEGORY_STATS;
  }

  // GET /progress/heatmap (specific before /progress)
  if (method === "GET" && path.startsWith("/progress/heatmap")) {
    return buildMockHeatmap() satisfies HeatmapResponse;
  }

  // GET /progress?memberUuid=...
  if (
    method === "GET" &&
    (path === "/progress" || path.startsWith("/progress?"))
  ) {
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
    return {
      memberUuid: "mock-uuid-1234-5678-abcd",
      nickname: "용감한 판다",
    } satisfies MemberRegisterResponse;
  }

  // GET /members/me
  if (method === "GET" && path.startsWith("/members/me")) {
    return {
      memberUuid: "mock-uuid-1234-5678-abcd",
      nickname: "용감한 판다",
      role: "USER",
      status: "ACTIVE",
      isTestAccount: false,
      createdAt: "2026-04-07T12:00:00",
      lastSeenAt: "2026-04-08T01:00:00",
    } satisfies MemberMeResponse;
  }

  // POST /members/me/regenerate-nickname
  if (method === "POST" && path.includes("/regenerate-nickname")) {
    return { nickname: "빠른 코끼리" } satisfies NicknameRegenerateResponse;
  }

  // POST /ai/explain-error
  if (method === "POST" && path === "/ai/explain-error") {
    return {
      text: "선택한 SQL에서 `o.cust_id`는 존재하지 않는 컬럼입니다.\n\n**올바른 참조:**\n`o.customer_id`를 사용해야 ORDERS 테이블의 외래키를 정확히 참조할 수 있습니다.\n\n```sql\nJOIN ORDERS o ON c.id = o.customer_id\n```",
      promptVersion: 1,
    } satisfies AiResult;
  }

  // POST /ai/diff-explain
  if (method === "POST" && path === "/ai/diff-explain") {
    return {
      text: "선택지 C가 오답인 이유를 분석해 보겠습니다.\n\n**문제점: GROUP BY 절의 컬럼 참조 오류**\n\n`GROUP BY name`은 표준 SQL에서 모호한 참조입니다. 여러 테이블을 조인할 때는 반드시 테이블 별칭을 명시해야 합니다.\n\n```sql\n-- 올바른 SQL\nGROUP BY c.name\n```",
      promptVersion: 1,
    } satisfies AiResult;
  }

  // GET /ai/similar/:uuid
  if (method === "GET" && path.includes("/ai/similar/")) {
    return [
      {
        questionUuid: "q-uuid-0006",
        stem: "LEFT JOIN과 INNER JOIN의 결과 차이는?",
        topicName: "조인 (JOIN)",
        score: 0.92,
      },
      {
        questionUuid: "q-uuid-0007",
        stem: "GROUP BY와 HAVING의 실행 순서는?",
        topicName: "그룹함수 / 집계",
        score: 0.85,
      },
    ] satisfies SimilarQuestion[];
  }

  return null;
}
