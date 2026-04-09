import { describe, it, expect, vi } from "vitest";
import { getMockResponse, generateChoicesMock } from "./mock-data";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  ExecuteResult,
  SubmitResult,
  ProgressResponse,
  TopicTree,
  AiResult,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
  TodayQuestionResponse,
  RecommendationsResponse,
  GreetingResponse,
  ExamScheduleResponse,
  ChoiceSetComplete,
  ChoiceGenerationStatus,
} from "../types/api";

describe("getMockResponse", () => {
  describe("Questions", () => {
    it("returns paginated question list for GET /questions", () => {
      const result = getMockResponse("/questions?page=0&size=5", "GET") as Page<QuestionSummary>;
      expect(result.content).toHaveLength(5);
      expect(result.totalElements).toBeGreaterThan(0);
      expect(result.first).toBe(true);
      expect(result.number).toBe(0);
    });

    it("filters by topic code", () => {
      const result = getMockResponse("/questions?page=0&size=10&topic=JOIN", "GET") as Page<QuestionSummary>;
      expect(result.content.every((q) => q.topicName === "JOIN")).toBe(true);
      expect(result.content.length).toBe(2);
    });

    it("filters by topic code with Korean displayName", () => {
      const result = getMockResponse("/questions?page=0&size=10&topic=SUBQUERY", "GET") as Page<QuestionSummary>;
      expect(result.content.every((q) => q.topicName === "서브쿼리")).toBe(true);
      expect(result.content.length).toBe(2);
    });

    it("returns empty page for non-existent topic", () => {
      const result = getMockResponse("/questions?page=0&size=10&topic=NONEXIST", "GET") as Page<QuestionSummary>;
      expect(result.content).toHaveLength(0);
      expect(result.empty).toBe(true);
    });

    it("returns question detail for GET /questions/:uuid", () => {
      const result = getMockResponse("/questions/q-uuid-0001", "GET") as QuestionDetail;
      expect(result.questionUuid).toBe("q-uuid-0001");
      expect(result.stem).toBeTruthy();
    });

    it("returns correct uuid for any question detail", () => {
      const result = getMockResponse("/questions/q-uuid-0042", "GET") as QuestionDetail;
      expect(result.questionUuid).toBe("q-uuid-0042");
    });
  });

  describe("Execute", () => {
    it("returns success for valid SQL", () => {
      const result = getMockResponse(
        "/questions/1/execute",
        "POST",
        JSON.stringify({ sql: "SELECT c.name FROM CUSTOMER c" }),
      ) as ExecuteResult;
      expect(result.status).toBe("SUCCESS");
      expect(result.errorCode).toBeNull();
      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.columns).toContain("name");
    });

    it("returns error for SQL with cust_id", () => {
      const result = getMockResponse(
        "/questions/1/execute",
        "POST",
        JSON.stringify({ sql: "SELECT * FROM ORDERS o WHERE o.cust_id = 1" }),
      ) as ExecuteResult;
      expect(result.status).toBe("ERROR");
      expect(result.errorCode).toBe("SQL_SYNTAX");
      expect(result.errorMessage).toContain("cust_id");
    });
  });

  describe("Submit", () => {
    it("returns correct for key A", () => {
      const result = getMockResponse(
        "/questions/1/submit",
        "POST",
        JSON.stringify({ selectedKey: "A" }),
      ) as SubmitResult;
      expect(result.isCorrect).toBe(true);
      expect(result.correctKey).toBe("A");
    });

    it("returns incorrect for key C", () => {
      const result = getMockResponse(
        "/questions/1/submit",
        "POST",
        JSON.stringify({ selectedKey: "C" }),
      ) as SubmitResult;
      expect(result.isCorrect).toBe(false);
      expect(result.correctKey).toBe("A");
      expect(result.rationale).toBeTruthy();
    });
  });

  describe("Progress", () => {
    it("returns progress response", () => {
      const result = getMockResponse("/progress", "GET") as ProgressResponse;
      expect(result.solvedCount).toBe(42);
      expect(result.correctRate).toBeCloseTo(0.685);
      expect(result.streakDays).toBe(3);
    });
  });

  describe("New APIs", () => {
    it("returns today question", () => {
      const result = getMockResponse("/questions/today", "GET") as TodayQuestionResponse;
      expect(result.question).not.toBeNull();
      expect(result.alreadySolvedToday).toBe(false);
    });

    it("returns recommendations", () => {
      const result = getMockResponse("/questions/recommendations", "GET") as RecommendationsResponse;
      expect(result.questions.length).toBeGreaterThan(0);
    });

    it("returns greeting", () => {
      const result = getMockResponse("/home/greeting?memberUuid=abc", "GET") as GreetingResponse;
      expect(result.message).toBeTruthy();
    });

    it("returns exam schedules", () => {
      const result = getMockResponse("/exam-schedules", "GET") as ExamScheduleResponse[];
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("certType");
    });

    it("returns selected exam schedule", () => {
      const result = getMockResponse("/exam-schedules/selected", "GET") as ExamScheduleResponse;
      expect(result.isSelected).toBe(true);
    });
  });

  describe("Meta", () => {
    it("returns topic tree", () => {
      const result = getMockResponse("/meta/topics", "GET") as TopicTree[];
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("displayName");
      expect(result[0]).toHaveProperty("subtopics");
    });

    it("returns concept tags", () => {
      const result = getMockResponse("/meta/tags", "GET") as unknown[];
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Members", () => {
    it("returns register response", () => {
      const result = getMockResponse("/members/register", "POST") as MemberRegisterResponse;
      expect(result.memberUuid).toBeTruthy();
      expect(result.nickname).toBeTruthy();
    });

    it("returns member info", () => {
      const result = getMockResponse("/members/me?memberUuid=abc", "GET") as MemberMeResponse;
      expect(result.nickname).toBeTruthy();
      expect(result.role).toBe("USER");
    });

    it("returns new nickname on regenerate", () => {
      const result = getMockResponse("/members/me/regenerate-nickname?memberUuid=abc", "POST") as NicknameRegenerateResponse;
      expect(result.nickname).toBeTruthy();
    });
  });

  describe("AI", () => {
    it("returns explain-error result", () => {
      const result = getMockResponse("/ai/explain-error", "POST", "{}") as AiResult;
      expect(result.text).toBeTruthy();
      expect(result.promptVersion).toBe(1);
    });

    it("returns diff-explain result", () => {
      const result = getMockResponse("/ai/diff-explain", "POST", "{}") as AiResult;
      expect(result.text).toBeTruthy();
    });

    it("returns similar questions", () => {
      const result = getMockResponse("/ai/similar/1?k=3", "GET") as unknown[];
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Unknown routes", () => {
    it("returns null for unknown path", () => {
      expect(getMockResponse("/unknown", "GET")).toBeNull();
    });

    it("returns null for unknown method", () => {
      expect(getMockResponse("/progress", "DELETE")).toBeNull();
    });
  });
});

describe("generateChoicesMock", () => {
  it("calls onStatus then onComplete in sequence", async () => {
    const onStatus = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const abort = generateChoicesMock("q-uuid-0001", { onStatus, onComplete, onError });

    await new Promise((r) => setTimeout(r, 1000));

    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "generating" })
    );
    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "validating" })
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceSetId: expect.stringContaining("cs-mock-"),
        choices: expect.arrayContaining([
          expect.objectContaining({ key: "A" }),
        ]),
      })
    );
    expect(onError).not.toHaveBeenCalled();
    abort();
  });

  it("does not call onComplete if aborted immediately", async () => {
    const onComplete = vi.fn();
    const abort = generateChoicesMock("q-uuid-0001", {
      onStatus: vi.fn(),
      onComplete,
      onError: vi.fn(),
    });
    abort();
    await new Promise((r) => setTimeout(r, 1000));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("stops remaining callbacks when aborted mid-flight", async () => {
    const onStatus = vi.fn();
    const onComplete = vi.fn();
    const abort = generateChoicesMock("q-uuid-0001", {
      onStatus,
      onComplete,
      onError: vi.fn(),
    });

    // Wait past 200ms so "generating" fires
    await new Promise((r) => setTimeout(r, 300));
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ phase: "generating" }));

    // Abort before 500ms (validating) and 800ms (complete)
    abort();

    await new Promise((r) => setTimeout(r, 700));
    expect(onStatus).toHaveBeenCalledTimes(1); // no additional calls
    expect(onComplete).not.toHaveBeenCalled();
  });
});
