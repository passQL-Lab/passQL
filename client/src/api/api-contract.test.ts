/**
 * API Contract Tests
 *
 * 프론트-백엔드 API 필드명/타입 계약을 검증한다.
 * 이 테스트가 깨지면 프론트가 백엔드 스펙과 어긋난 것이다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- fetch mock ---
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// memberStore mock — getMemberUuid가 항상 고정 UUID 반환
vi.mock("../stores/memberStore", () => ({
  getMemberUuid: () => "test-member-uuid",
}));

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

// --- Tests ---

describe("AI API 계약", () => {
  describe("explainError — POST /ai/explain-error", () => {
    it("body에 camelCase 필드명을 사용한다 (errorMessage, not error_message)", async () => {
      const { explainError } = await import("./ai");

      await explainError({
        questionUuid: "q-uuid-001",
        sql: "SELECT * FROM t",
        errorMessage: "Unknown column",
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toHaveProperty("errorMessage");
      expect(body).not.toHaveProperty("error_message");
      expect(body.questionUuid).toBe("q-uuid-001");
      expect(body.sql).toBe("SELECT * FROM t");
      expect(body.errorMessage).toBe("Unknown column");
    });

    it("X-Member-UUID 헤더를 포함한다", async () => {
      const { explainError } = await import("./ai");

      await explainError({
        questionUuid: "q-uuid-001",
        sql: "SELECT 1",
        errorMessage: "err",
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Member-UUID"]).toBe("test-member-uuid");
    });
  });

  describe("diffExplain — POST /ai/diff-explain", () => {
    it("body에 camelCase 필드명을 사용한다 (questionUuid + selectedChoiceKey)", async () => {
      const { diffExplain } = await import("./ai");

      await diffExplain({
        questionUuid: "q-uuid-002",
        selectedChoiceKey: "C",
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(body).toHaveProperty("questionUuid");
      expect(body).toHaveProperty("selectedChoiceKey");
      expect(body).not.toHaveProperty("question_id");
      expect(body).not.toHaveProperty("selected_key");
      expect(body.questionUuid).toBe("q-uuid-002");
      expect(body.selectedChoiceKey).toBe("C");
    });

    it("X-Member-UUID 헤더를 포함한다", async () => {
      const { diffExplain } = await import("./ai");

      await diffExplain({
        questionUuid: "q-uuid-002",
        selectedChoiceKey: "C",
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Member-UUID"]).toBe("test-member-uuid");
    });
  });

  describe("fetchSimilar — GET /ai/similar/{uuid}", () => {
    it("path에 questionUuid를 포함한다", async () => {
      const { fetchSimilar } = await import("./ai");

      await fetchSimilar("q-uuid-003", 3);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/ai/similar/q-uuid-003");
      expect(url).toContain("k=3");
    });
  });
});

describe("Questions API 계약", () => {
  describe("submitAnswer — POST /questions/{uuid}/submit", () => {
    it("body에 selectedChoiceKey만 포함한다 (choiceSetId 없음)", async () => {
      const { submitAnswer } = await import("./questions");

      await submitAnswer("q-uuid-004", "B");

      const [url, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toContain("/questions/q-uuid-004/submit");
      expect(body).toEqual({ selectedChoiceKey: "B" });
      expect(body).not.toHaveProperty("choiceSetId");
    });

    it("X-Member-UUID 헤더를 포함한다", async () => {
      const { submitAnswer } = await import("./questions");

      await submitAnswer("q-uuid-004", "A");

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers["X-Member-UUID"]).toBe("test-member-uuid");
    });

    it("2개 파라미터만 받는다 (choiceSetId 파라미터 제거됨)", async () => {
      const { submitAnswer } = await import("./questions");
      expect(submitAnswer.length).toBe(2);
    });
  });

  describe("executeChoice — POST /questions/{uuid}/execute", () => {
    it("body에 sql 필드를 포함한다", async () => {
      const { executeChoice } = await import("./questions");

      await executeChoice("q-uuid-005", "SELECT 1");

      const [url, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);

      expect(url).toContain("/questions/q-uuid-005/execute");
      expect(body).toEqual({ sql: "SELECT 1" });
    });
  });
});

describe("Progress API 계약", () => {
  describe("fetchHeatmap — GET /progress/heatmap", () => {
    it("path에 memberUuid, from, to 파라미터를 포함한다", async () => {
      const { fetchHeatmap } = await import("./progress");

      await fetchHeatmap("test-uuid", "2026-03-10", "2026-04-09");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/progress/heatmap");
      expect(url).toContain("memberUuid=test-uuid");
      expect(url).toContain("from=2026-03-10");
      expect(url).toContain("to=2026-04-09");
    });

    it("from, to 생략 시 memberUuid만 포함한다", async () => {
      const { fetchHeatmap } = await import("./progress");

      await fetchHeatmap("test-uuid");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("memberUuid=test-uuid");
      expect(url).not.toContain("from=");
      expect(url).not.toContain("to=");
    });
  });
});

describe("generateChoices 제거 확인", () => {
  it("questions 모듈에서 generateChoices가 export되지 않는다", async () => {
    const questions = await import("./questions");
    expect(questions).not.toHaveProperty("generateChoices");
  });
});

describe("타입 계약 (컴파일 타임 검증 보조)", () => {
  it("ExplainErrorPayload에 errorMessage 필드가 있다 (snake_case 아님)", () => {
    const payload: import("../types/api").ExplainErrorPayload = {
      questionUuid: "q-uuid",
      sql: "SELECT 1",
      errorMessage: "err",
    };
    expect(payload.errorMessage).toBe("err");
    expect(payload).not.toHaveProperty("error_message");
  });

  it("DiffExplainPayload에 questionUuid와 selectedChoiceKey가 있다", () => {
    const payload: import("../types/api").DiffExplainPayload = {
      questionUuid: "q-uuid",
      selectedChoiceKey: "A",
    };
    expect(payload.questionUuid).toBe("q-uuid");
    expect(payload.selectedChoiceKey).toBe("A");
    expect(payload).not.toHaveProperty("question_id");
    expect(payload).not.toHaveProperty("selected_key");
  });

  it("QuestionDetail에 choices 필드가 있다", () => {
    const detail: import("../types/api").QuestionDetail = {
      questionUuid: "q-uuid",
      topicName: "JOIN",
      subtopicName: "INNER",
      difficulty: 2,
      executionMode: "EXECUTABLE",
      stem: "test",
      schemaDisplay: "test",
      choices: [{ key: "A", kind: "SQL", body: "SELECT 1", sortOrder: 1 }],
    };
    expect(detail.choices).toHaveLength(1);
    expect(detail.choices[0].key).toBe("A");
  });

  it("HeatmapEntry와 HeatmapResponse 타입이 정의되어 있다", () => {
    const entry: import("../types/api").HeatmapEntry = {
      date: "2026-04-09",
      solvedCount: 3,
      correctCount: 2,
    };
    expect(entry.date).toBe("2026-04-09");
    expect(entry.solvedCount).toBe(3);
    expect(entry.correctCount).toBe(2);

    const response: import("../types/api").HeatmapResponse = {
      entries: [entry],
    };
    expect(response.entries).toHaveLength(1);
  });

  it("SubmitPayload, ChoiceGenerationPhase 등 SSE 타입이 export되지 않는다", async () => {
    const types = await import("../types/api");
    expect(types).not.toHaveProperty("SubmitPayload");
    expect(types).not.toHaveProperty("ChoiceGenerationPhase");
    expect(types).not.toHaveProperty("ChoiceGenerationStatus");
    expect(types).not.toHaveProperty("ChoiceSetComplete");
    expect(types).not.toHaveProperty("ChoiceGenerationError");
  });
});
