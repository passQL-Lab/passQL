import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SqlPlayground } from "./SqlPlayground";
import type { ExecuteResult } from "../types/api";

const mockExecute = vi.fn();
const successResult: ExecuteResult = {
  status: "SUCCESS",
  columns: ["id", "name"],
  rows: [[1, "홍길동"]],
  rowCount: 1,
  elapsedMs: 12,
  errorCode: null,
  errorMessage: null,
};

describe("SqlPlayground", () => {
  it("토글 버튼이 렌더링됨", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    expect(screen.getByText("SQL 실행기")).toBeInTheDocument();
  });

  it("기본적으로 닫혀있고 textarea가 보이지 않음", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    expect(screen.queryByPlaceholderText(/SELECT/i)).not.toBeInTheDocument();
  });

  it("토글 클릭 시 textarea 표시", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.click(screen.getByText("SQL 실행기"));
    expect(screen.getByPlaceholderText(/SELECT/i)).toBeInTheDocument();
  });

  it("SQL이 비어있으면 실행 버튼 비활성화", () => {
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.click(screen.getByText("SQL 실행기"));
    expect(screen.getByText("실행")).toBeDisabled();
  });

  it("실행 버튼 클릭 시 onExecute 호출", async () => {
    mockExecute.mockResolvedValue(successResult);
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.click(screen.getByText("SQL 실행기"));
    fireEvent.change(screen.getByPlaceholderText(/SELECT/i), {
      target: { value: "SELECT * FROM CUSTOMER" },
    });
    fireEvent.click(screen.getByText("실행"));
    await waitFor(() => expect(mockExecute).toHaveBeenCalledWith("SELECT * FROM CUSTOMER"));
  });

  it("실행 결과 렌더링", async () => {
    mockExecute.mockResolvedValue(successResult);
    render(<SqlPlayground questionUuid="uuid-1" onExecute={mockExecute} />);
    fireEvent.click(screen.getByText("SQL 실행기"));
    fireEvent.change(screen.getByPlaceholderText(/SELECT/i), {
      target: { value: "SELECT * FROM CUSTOMER" },
    });
    fireEvent.click(screen.getByText("실행"));
    await waitFor(() => expect(screen.getByText("홍길동")).toBeInTheDocument());
  });
});
