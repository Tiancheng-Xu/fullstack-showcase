import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { GrowthContent } from "../growth-content";
import { GrowthRecordsContent } from "../growth-records-content";
import { VaccineContent } from "../vaccine-content";

describe("Stitch growth flows", () => {
	it("uses the shared baby profile and exposes all record types", async () => {
		const user = userEvent.setup();
		render(<GrowthContent />);

		expect(screen.getByText(/金金/)).toBeVisible();
		await user.click(screen.getByRole("button", { name: "添加记录" }));

		for (const type of ["喂奶", "睡眠", "身高", "体重"]) {
			expect(screen.getByRole("option", { name: type })).toBeVisible();
		}
	});

	it("filters and deletes a growth record after confirmation", async () => {
		const user = userEvent.setup();
		render(<GrowthRecordsContent />);

		await user.click(screen.getByRole("button", { name: "喂养" }));
		expect(screen.getByText("180 ml")).toBeVisible();
		expect(screen.queryByText("1.5 hr")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "删除 喂奶" }));
		expect(
			screen.getByRole("dialog", { name: "删除这条记录？" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "确认删除" }));

		expect(screen.queryByText("180 ml")).not.toBeInTheDocument();
	});

	it("toggles the upcoming vaccine reminder locally", async () => {
		const user = userEvent.setup();
		render(<VaccineContent />);

		const reminder = screen.getByRole("switch", {
			name: "乙肝疫苗提醒",
		});
		expect(reminder).toHaveAttribute("aria-checked", "true");
		await user.click(reminder);
		expect(reminder).toHaveAttribute("aria-checked", "false");
	});
});
