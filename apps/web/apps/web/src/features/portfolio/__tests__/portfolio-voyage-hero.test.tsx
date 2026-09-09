import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioVoyageHero, VoyageLoadingOverlay } from "../portfolio-voyage-hero";

describe("PortfolioVoyageHero", () => {
  it("keeps the voyage statement and destination available without WebGL", () => {
    render(<PortfolioVoyageHero forceStatic />);

    expect(
      screen.getByRole("heading", { name: "向复杂系统深处航行" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("动态场景已关闭")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "探索技术图谱" })).toHaveAttribute(
      "href",
      "#technology-map",
    );
  });

	it("shows staged ocean-engine loading progress", () => {
		render(<VoyageLoadingOverlay progress={68} />);

		expect(screen.getByText("INITIALIZING OCEAN ENGINE")).toBeInTheDocument();
		expect(screen.getByText("68%")).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "68");
		expect(screen.getByText("正在准备浅海航行场景")).toBeInTheDocument();
	});
});
