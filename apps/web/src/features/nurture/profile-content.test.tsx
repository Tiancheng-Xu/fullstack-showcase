import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, ...props }: ComponentProps<"a"> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

import { ProfileContent } from "./profile-content";

describe("ProfileContent product links", () => {
	it("links to the GitHub Profile product route", () => {
		render(<ProfileContent />);

		const link = screen.getByRole("link", { name: /GitHub 个人资料/ });
		expect(link).toHaveAttribute("href", "/projects/github-profile");
		expect(document.body).not.toHaveTextContent(/作业|课程|老师|验收/);
	});
});
