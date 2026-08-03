import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GrowthContent } from "../growth-content";
import { GuideContent } from "../guide-content";
import { MomentsContent } from "../moments-content";

describe("Nurture Bloom local interactions", () => {
	it("adds a new growth record without a backend", async () => {
		const user = userEvent.setup();
		render(<GrowthContent />);

		await user.click(screen.getByRole("button", { name: "添加记录" }));
		await user.clear(screen.getByLabelText("记录数值"));
		await user.type(screen.getByLabelText("记录数值"), "210");
		await user.click(screen.getByRole("button", { name: "保存记录" }));

		expect(screen.getByText("210 ml")).toBeVisible();
	});

	it("filters guide content by search text", async () => {
		const user = userEvent.setup();
		render(<GuideContent />);

		await user.type(screen.getByPlaceholderText("搜索育儿知识..."), "安抚");

		expect(screen.getByText("安抚奶嘴的使用")).toBeVisible();
		expect(screen.queryByText("如何预防感冒")).not.toBeInTheDocument();
	});

	it("toggles a moment favorite locally", async () => {
		const user = userEvent.setup();
		render(<MomentsContent />);

		const favorite = screen.getByRole("button", {
			name: "收藏 阳光下的温暖时光",
		});
		await user.click(favorite);

		expect(favorite).toHaveAttribute("aria-pressed", "true");
	});

	it("describes future Moments capability as a product version", async () => {
		const user = userEvent.setup();
		render(<MomentsContent />);

		await user.click(screen.getByRole("button", { name: "添加时光" }));

		expect(screen.getByText("后续版本将接入真实图片上传")).toBeVisible();
		expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
	});
});
