import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResultTable } from "./ResultTable";
import type { ExecuteResult } from "../types/api";

const successResult: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [["홍길동", 2], ["김영희", 3]],
  rowCount: 2,
  elapsedMs: 34,
  errorCode: null,
  errorMessage: null,
};

const errorResult: ExecuteResult = {
  status: "ERROR",
  columns: [],
  rows: [],
  rowCount: 0,
  elapsedMs: 0,
  errorCode: "UNKNOWN_COLUMN",
  errorMessage: "Unknown column 'o.cust_id'",
};

describe("ResultTable", () => {
  it("성공 결과: 행 수, 시간, 테이블 헤더/셀 렌더링", () => {
    render(<ResultTable result={successResult} />);
    expect(screen.getByText("2행 · 34ms")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("에러 결과: errorCode와 errorMessage 렌더링", () => {
    render(<ResultTable result={errorResult} />);
    expect(screen.getByText("UNKNOWN_COLUMN")).toBeInTheDocument();
    expect(screen.getByText("Unknown column 'o.cust_id'")).toBeInTheDocument();
  });

  it("컬럼이 없으면 테이블 미렌더링", () => {
    const noColResult = { ...successResult, columns: [], rows: [], rowCount: 0 };
    render(<ResultTable result={noColResult} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("onAskAi prop 있을 때 에러 카드에 AI 버튼 렌더링", () => {
    const mockFn = vi.fn();
    render(<ResultTable result={errorResult} onAskAi={mockFn} />);
    expect(screen.getByText("AI에게 물어보기")).toBeInTheDocument();
  });
});
