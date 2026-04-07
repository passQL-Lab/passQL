import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorFallback from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("renders default error message", () => {
    render(<ErrorFallback />);
    expect(screen.getByText("데이터를 불러올 수 없습니다")).toBeInTheDocument();
  });

  it("renders custom error message", () => {
    render(<ErrorFallback message="서버 오류가 발생했습니다" />);
    expect(screen.getByText("서버 오류가 발생했습니다")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    render(<ErrorFallback onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: /다시 시도/i })).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorFallback />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /다시 시도/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
