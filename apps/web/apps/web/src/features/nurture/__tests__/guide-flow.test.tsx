import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GuideArticleContent } from "../guide-article-content";
import { GuideContent } from "../guide-content";
import { guideProviders } from "../guide-providers";

describe("China-first parenting guide", () => {
	it("combines category and keyword filtering", async () => {
		const user = userEvent.setup();
		render(<GuideContent />);

		await user.click(screen.getByRole("button", { name: "护理" }));
		await user.type(screen.getByPlaceholderText("搜索育儿知识..."), "奶嘴");

		expect(screen.getByText("安抚奶嘴的使用")).toBeVisible();
		expect(screen.queryByText("如何预防感冒")).not.toBeInTheDocument();
		expect(screen.queryByText("宝宝第一口辅食")).not.toBeInTheDocument();
	});

	it("shows Chinese source provenance and the medical disclaimer", () => {
		render(<GuideArticleContent articleId="feeding" />);

		expect(
			screen.getByRole("heading", { name: "宝宝第一口辅食" }),
		).toBeVisible();
		expect(screen.getByText("资料来源")).toBeVisible();
		expect(
			screen.getByRole("link", { name: /国家卫生健康委员会/ }),
		).toHaveAttribute(
			"href",
			expect.stringMatching(/^https:\/\/www\.nhc\.gov\.cn\//),
		);
		expect(screen.getByText(/不能替代医生诊断与治疗建议/)).toBeVisible();
	});

	it("registers multiple public-network providers without calling them in V1", () => {
		expect(guideProviders.map((provider) => provider.id)).toEqual(
			expect.arrayContaining(["phda", "jcph", "pubmed"]),
		);
		expect(guideProviders.every((provider) => provider.locale)).toBe(true);
	});
});
