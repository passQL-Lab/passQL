import { describe, it, expect } from "vitest";
import { getMockResponse } from "./mock-data";
import type {
  Page,
  QuestionSummary,
  QuestionDetail,
  ExecuteResult,
  SubmitResult,
  ProgressSummary,
  HeatmapEntry,
  TopicTree,
  AiResult,
  MemberRegisterResponse,
  MemberMeResponse,
  NicknameRegenerateResponse,
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

    it("filters by topic", () => {
      const result = getMockResponse("/questions?page=0&size=10&topic=JOIN", "GET") as Page<QuestionSummary>;
      expect(result.content.every((q) => q.topicCode === "JOIN")).toBe(true);
    });

    it("returns empty page for non-existent topic", () => {
      const result = getMockResponse("/questions?page=0&size=10&topic=NONEXIST", "GET") as Page<QuestionSummary>;
      expect(result.content).toHaveLength(0);
      expect(result.empty).toBe(true);
    });

    it("returns question detail for GET /questions/:id", () => {
      const result = getMockResponse("/questions/1", "GET") as QuestionDetail;
      expect(result.id).toBe(1);
      expect(result.stem).toBeTruthy();
      expect(result.choices).toHaveLength(4);
    });

    it("returns correct id for any question detail", () => {
      const result = getMockResponse("/questions/42", "GET") as QuestionDetail;
      expect(result.id).toBe(42);
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
    it("returns progress summary", () => {
      const result = getMockResponse("/progress", "GET") as ProgressSummary;
      expect(result.solved).toBe(42);
      expect(result.correctRate).toBeCloseTo(68.5);
      expect(result.streakDays).toBe(3);
    });

    it("returns heatmap entries", () => {
      const result = getMockResponse("/progress/heatmap", "GET") as HeatmapEntry[];
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("topicCode");
      expect(result[0]).toHaveProperty("correctRate");
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
