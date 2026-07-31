import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MomentDetailContent } from "../moment-detail-content";
import { MomentsContent } from "../moments-content";

describe("Stitch moments flow", () => {
	it("uses local Stitch photos and links the lead moment to its detail", () => {
		render(<MomentsContent />);

		const image = screen.getByRole("img", {
			name: "阳光下的温暖时光",
		});
		expect(image).toHaveAttribute(
			"src",
			expect.stringMatching(/^\/assets\/nurture-bloom\/stitch\//),
		);
		expect(
			screen.getByRole("link", { name: "查看 阳光下的温暖时光" }),
		).toHaveAttribute("href", "/moments/sunshine");
	});

	it("renders a complete moment detail from the shared mock data", () => {
		render(<MomentDetailContent momentId="sunshine" />);

		expect(
			screen.getByRole("heading", { name: "阳光下的温暖时光" }),
		).toBeVisible();
		expect(
			screen.getByText("午后的阳光刚刚好，金金看见妈妈就笑弯了眼睛。"),
		).toBeVisible();
		expect(screen.getByText("笑容")).toBeVisible();
	});
});
