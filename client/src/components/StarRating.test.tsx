import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StarRating } from "./StarRating";

describe("StarRating", () => {
  it("renders 3 star icons", () => {
    const { container } = render(<StarRating level={2} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(3);
  });

  it("fills correct number of stars for level 1", () => {
    const { container } = render(<StarRating level={1} />);
    const filled = container.querySelectorAll("svg.fill-\\[var\\(--color-sem-warning\\)\\]");
    expect(filled).toHaveLength(1);
  });

  it("fills correct number of stars for level 3", () => {
    const { container } = render(<StarRating level={3} />);
    const filled = container.querySelectorAll("svg.fill-\\[var\\(--color-sem-warning\\)\\]");
    expect(filled).toHaveLength(3);
  });

  it("fills no stars for level 0", () => {
    const { container } = render(<StarRating level={0} />);
    const filled = container.querySelectorAll("svg.fill-\\[var\\(--color-sem-warning\\)\\]");
    expect(filled).toHaveLength(0);
  });

  it("renders as a span element", () => {
    const { container } = render(<StarRating level={2} />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });
});
