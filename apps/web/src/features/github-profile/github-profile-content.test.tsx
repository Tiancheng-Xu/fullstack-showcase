import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	type GitHubProfileApi,
	GitHubProfileContent,
} from "./github-profile-content";

const profile = {
	githubId: 42,
	login: "Tiancheng-Xu",
	displayName: "Tiancheng Xu",
	bio: "Learning AI full-stack development",
	avatarUrl: "https://avatars.githubusercontent.com/u/42?v=4",
	profileUrl: "https://github.com/Tiancheng-Xu",
	publicRepos: 3,
	followers: 2,
	githubCreatedAt: "2020-01-01T00:00:00Z",
	syncedAt: "2026-07-31T12:00:00.000Z",
};

function fakeApi(overrides: Partial<GitHubProfileApi> = {}): GitHubProfileApi {
	return {
		readFromGitHub: vi.fn(async () => profile),
		readSaved: vi.fn(async () => null),
		save: vi.fn(async (input) => ({ ...profile, ...input })),
		...overrides,
	};
}

describe("GitHub profile homework form", () => {
	it("presents the profile as a product page", async () => {
		render(<GitHubProfileContent api={fakeApi()} />);

		expect(await screen.findByText("GitHub 个人资料")).toBeVisible();
		expect(screen.getByText("AI 全栈个人资料")).toBeVisible();
		expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
	});

	it("shows the empty saved state without exposing a credential field", async () => {
		render(<GitHubProfileContent api={fakeApi()} />);

		expect(await screen.findByText("尚未保存 GitHub 资料")).toBeVisible();
		expect(
			screen.queryByText(/token|PAT|GITHUB_TOKEN/i),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/密码|令牌/i)).not.toBeInTheDocument();
		expect(document.querySelector('input[type="password"]')).toBeNull();
	});

	it("reads GitHub data and exposes only name and biography as editable", async () => {
		const user = userEvent.setup();
		render(<GitHubProfileContent api={fakeApi()} />);
		await screen.findByText("尚未保存 GitHub 资料");

		await user.click(
			screen.getByRole("button", { name: "读取我的 GitHub 资料" }),
		);

		expect(await screen.findByDisplayValue("Tiancheng Xu")).toBeVisible();
		expect(
			screen.getByDisplayValue("Learning AI full-stack development"),
		).toBeVisible();
		expect(screen.getByText("@Tiancheng-Xu")).toBeVisible();
		expect(screen.getByText("3 个公开仓库")).toBeVisible();
		expect(screen.getByText("2 位关注者")).toBeVisible();
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
	});

	it("saves only the reviewed display name and biography", async () => {
		const user = userEvent.setup();
		const api = fakeApi();
		render(<GitHubProfileContent api={api} />);
		await screen.findByText("尚未保存 GitHub 资料");
		await user.click(
			screen.getByRole("button", { name: "读取我的 GitHub 资料" }),
		);
		const displayName = await screen.findByLabelText("显示名称");
		await user.clear(displayName);
		await user.type(displayName, "Edited name");
		const bio = screen.getByLabelText("个人简介");
		await user.clear(bio);
		await user.type(bio, "Edited bio");

		await user.click(screen.getByRole("button", { name: "保存到数据库" }));

		expect(api.save).toHaveBeenCalledWith({
			displayName: "Edited name",
			bio: "Edited bio",
		});
		expect(await screen.findByText("资料已保存")).toBeVisible();
		expect(screen.getByText("@Tiancheng-Xu")).toBeVisible();
	});

	it.each([
		["GITHUB_TOKEN_MISSING", "尚未在系统钥匙串中保存 GitHub 访问凭据。"],
		["GITHUB_AUTH_FAILED", "GitHub 访问凭据无效或已过期。"],
		["GITHUB_RATE_LIMITED", "GitHub 请求过于频繁，请稍后再试。"],
		["VALIDATION_FAILED", "请检查显示名称和个人简介。"],
		["DATABASE_FAILED", "暂时无法保存资料，请稍后再试。"],
	] as const)("shows a safe message for %s", async (code, message) => {
		const user = userEvent.setup();
		const api = fakeApi({
			readFromGitHub: vi.fn<GitHubProfileApi["readFromGitHub"]>(async () => {
				throw { code, message: "private detail" };
			}),
		});
		render(<GitHubProfileContent api={api} />);
		await screen.findByText("尚未保存 GitHub 资料");

		await user.click(
			screen.getByRole("button", { name: "读取我的 GitHub 资料" }),
		);

		expect(await screen.findByText(message)).toBeVisible();
		expect(screen.queryByText("private detail")).not.toBeInTheDocument();
	});

	it("disables actions while reading and focuses the result", async () => {
		let resolveProfile: ((value: typeof profile) => void) | undefined;
		const api = fakeApi({
			readFromGitHub: vi.fn<GitHubProfileApi["readFromGitHub"]>(
				() =>
					new Promise<typeof profile>((resolve) => {
						resolveProfile = resolve;
					}),
			),
		});
		const user = userEvent.setup();
		render(<GitHubProfileContent api={api} />);
		await screen.findByText("尚未保存 GitHub 资料");
		const readButton = screen.getByRole("button", {
			name: "读取我的 GitHub 资料",
		});

		await user.click(readButton);
		expect(readButton).toBeDisabled();
		expect(screen.getByRole("button", { name: "保存到数据库" })).toBeDisabled();
		resolveProfile?.(profile);

		const status = await screen.findByText("GitHub 资料读取成功");
		await waitFor(() => expect(status.parentElement).toHaveFocus());
	});
});
