import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChoiceCard } from "./ChoiceCard";
import type { ChoiceItem, ExecuteResult } from "../types/api";

const mockChoice: ChoiceItem = {
  key: "A",
  kind: "SQL",
  body: "SELECT * FROM users",
  isCorrect: true,
  rationale: "correct query",
  sortOrder: 1,
};

const mockSuccessResult: ExecuteResult = {
  status: "SUCCESS",
  columns: ["id", "name"],
  rows: [["1", "홍길동"], ["2", "김영희"]],
  rowCount: 2,
  elapsedMs: 34,
  errorCode: null,
  errorMessage: null,
};

const mockErrorResult: ExecuteResult = {
  status: "ERROR",
  columns: [],
  rows: [],
  rowCount: 0,
  elapsedMs: 0,
  errorCode: "SQL_SYNTAX",
  errorMessage: "Unknown column 'x' in 'field list'",
};

describe("ChoiceCard", () => {
  const defaultProps = {
    choice: mockChoice,
    isSelected: false,
    cached: undefined,
    isExecutable: true,
    isExecuting: false,
    onSelect: vi.fn(),
    onExecute: vi.fn(),
  };

  it("renders choice key", () => {
    render(<ChoiceCard {...defaultProps} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders SQL body in code block", () => {
    render(<ChoiceCard {...defaultProps} />);
    expect(screen.getByText("SELECT * FROM users")).toBeInTheDocument();
  });

  it("renders execute button when isExecutable", () => {
    render(<ChoiceCard {...defaultProps} />);
    expect(screen.getByRole("button", { name: /실행/i })).toBeInTheDocument();
  });

  it("hides execute button when not isExecutable", () => {
    render(<ChoiceCard {...defaultProps} isExecutable={false} />);
    expect(screen.queryByText("실행")).not.toBeInTheDocument();
  });

  it("calls onSelect with key and sql when radio clicked", () => {
    const onSelect = vi.fn();
    render(<ChoiceCard {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByLabelText("선택지 A"));
    expect(onSelect).toHaveBeenCalledWith("A", "SELECT * FROM users");
  });

  it("calls onExecute with key and sql when execute clicked", () => {
    const onExecute = vi.fn();
    render(<ChoiceCard {...defaultProps} onExecute={onExecute} />);

    fireEvent.click(screen.getByRole("button", { name: /실행/i }));
    expect(onExecute).toHaveBeenCalledWith("A", "SELECT * FROM users");
  });

  it("applies selected border when isSelected", () => {
    const { container } = render(<ChoiceCard {...defaultProps} isSelected={true} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-brand");
  });

  it("shows success result when cached with no error", () => {
    render(<ChoiceCard {...defaultProps} cached={mockSuccessResult} />);
    expect(screen.getByText(/2행/)).toBeInTheDocument();
    expect(screen.getByText(/34ms/)).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });

  it("shows error result when cached with errorCode", () => {
    render(<ChoiceCard {...defaultProps} cached={mockErrorResult} />);
    expect(screen.getByText("SQL_SYNTAX")).toBeInTheDocument();
    expect(screen.getByText("Unknown column 'x' in 'field list'")).toBeInTheDocument();
  });

  it("shows AI button on error result", () => {
    render(<ChoiceCard {...defaultProps} cached={mockErrorResult} />);
    expect(screen.getByText("AI에게 물어보기")).toBeInTheDocument();
  });

  it("calls onAskAi when AI button clicked", () => {
    const onAskAi = vi.fn();
    render(<ChoiceCard {...defaultProps} cached={mockErrorResult} onAskAi={onAskAi} />);

    fireEvent.click(screen.getByText("AI에게 물어보기"));
    expect(onAskAi).toHaveBeenCalledWith("A", "SQL_SYNTAX", "Unknown column 'x' in 'field list'");
  });

  it("disables execute button when cached exists", () => {
    render(<ChoiceCard {...defaultProps} cached={mockSuccessResult} />);
    const btn = screen.getByRole("button", { name: /실행/i });
    expect(btn).toBeDisabled();
  });

  it("shows loading text when isExecuting", () => {
    render(<ChoiceCard {...defaultProps} isExecuting={true} />);
    expect(screen.getByText("실행 중...")).toBeInTheDocument();
  });
});
