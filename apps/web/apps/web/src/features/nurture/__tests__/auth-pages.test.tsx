import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
	LoginContent,
	OnboardingContent,
	RegisterContent,
} from "../auth-pages";

describe("parent authentication screens", () => {
	it("submits a labelled login form", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<LoginContent onSuccess={onSuccess} />);

		await user.type(screen.getByLabelText("邮箱"), "parent@example.com");
		await user.type(screen.getByLabelText("密码"), "parent123");
		await user.click(screen.getByRole("button", { name: "登录" }));

		expect(onSuccess).toHaveBeenCalledOnce();
	});

	it("rejects mismatched registration passwords", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<RegisterContent onSuccess={onSuccess} />);

		await user.type(screen.getByLabelText("邮箱"), "parent@example.com");
		await user.type(screen.getByLabelText("密码"), "parent123");
		await user.type(screen.getByLabelText("确认密码"), "different123");
		await user.click(screen.getByRole("button", { name: "创建账号" }));

		expect(screen.getByText("两次输入的密码不一致")).toBeVisible();
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("creates the initial baby profile", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<OnboardingContent onSuccess={onSuccess} />);

		await user.clear(screen.getByLabelText("宝宝昵称"));
		await user.type(screen.getByLabelText("宝宝昵称"), "金金");
		await user.click(screen.getByRole("button", { name: "完成建档" }));

		expect(onSuccess).toHaveBeenCalledWith({
			nickname: "金金",
			birthDate: "2026-01-16",
			gender: "女",
		});
	});
});
