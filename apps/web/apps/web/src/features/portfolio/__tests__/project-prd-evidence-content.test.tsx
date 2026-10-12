import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		...props
	}: React.ComponentProps<"a"> & { to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useRouter: () => undefined,
}));
vi.mock("../use-portfolio-projects", () => ({
	usePortfolioProjects: () => ({ projects: [] }),
}));

import { EvidenceContent } from "../evidence-content";
import { EvidenceIndexContent } from "../evidence-index-content";

describe("project PRD summaries and legacy Evidence", () => {
	it("renders a registry-only parser page without inventing an implementation or homepage", () => {
		const { container } = render(
			<EvidenceContent projectId="enterprise-document-parser" />,
		);
		expect(container.querySelector("#prd-design")).toHaveTextContent(
			"文档通过 · 实现待验证",
		);
		expect(container).toHaveTextContent(
			"4eae6b9f814a848e1e68e684e031036984ac3eb08b8110ef1fa52a3197ea8fd1",
		);
		expect(container).toHaveTextContent("SHA-256 校验原件身份");
		expect(container).toHaveTextContent("未实现");
		expect(container).not.toHaveTextContent("进度 100%");
		expect(container).not.toHaveTextContent("项目不存在");
		expect(
			screen.queryByRole("link", { name: "项目主页" }),
		).not.toBeInTheDocument();
	});

	it("adds the reviewed summary while keeping the full migrated original", () => {
		const { container } = render(
			<EvidenceContent projectId="github-profile-studio" />,
		);
		expect(container.querySelector("#prd-design")).toHaveTextContent(
			"PRD 定位与证据边界",
		);
		expect(container).toHaveTextContent("迁移后的完整工作证明");
		expect(container).toHaveTextContent("Proof 矩阵");
	});

	it.each(["definitely-unknown", "__proto__", "constructor"])(
		"keeps unknown project ID %s unknown",
		(projectId) => {
			render(<EvidenceContent projectId={projectId} />);
			expect(screen.getByText("项目不存在")).toBeInTheDocument();
		},
	);

	it("indexes all summaries independently of Dashboard cards with true owner URLs", () => {
		const { container } = render(<EvidenceIndexContent />);
		const directory = container.querySelector(
			'[aria-label="逐项目 PRD 摘要索引"]',
		);
		expect(directory?.querySelectorAll("article")).toHaveLength(22);
		expect(directory).toHaveTextContent("宁波交警可视化大屏");
		expect(directory).toHaveTextContent("通用文档解析核心");
		expect(
			directory?.querySelector(
				'a[href="https://agent-market.baby2b.online/evidence/#prd-design"]',
			),
		).not.toBeNull();
		expect(directory).not.toHaveTextContent("/Users/");
	});
});
