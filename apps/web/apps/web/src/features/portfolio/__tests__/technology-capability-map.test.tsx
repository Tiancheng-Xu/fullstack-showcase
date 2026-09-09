import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TechnologyCapabilityMap } from "../technology-capability-map";

describe("TechnologyCapabilityMap", () => {
  it("renders the identity, four domains, and all 24 technologies in SSR-safe DOM", () => {
		const { container } = render(<TechnologyCapabilityMap />);

    expect(
      screen.getByRole("heading", { name: "徐天成" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("capability-domain")).toHaveLength(4);
		expect(screen.getAllByTestId("capability-node")).toHaveLength(24);
		expect(
			screen.queryByRole("button", { name: "暂停图谱动效" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("slider", { name: "图谱范围" })).not.toBeInTheDocument();
		expect(
			container.querySelector("canvas.technology-map__particle-canvas"),
		).toBeInTheDocument();
  });

  it("opens a technology detail and closes it with Escape", () => {
    render(<TechnologyCapabilityMap />);

    fireEvent.click(screen.getByRole("button", { name: /Qwen3 \/ QLoRA/ }));
    expect(screen.getByRole("dialog", { name: /Qwen3 \/ QLoRA/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /查看项目证据/ })).toHaveAttribute(
      "href",
      expect.stringContaining("evidence"),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
