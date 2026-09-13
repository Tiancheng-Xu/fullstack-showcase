import { createFileRoute } from "@tanstack/react-router";

import { ProjectIndexContent } from "@/features/portfolio/project-index-content";

export const Route = createFileRoute("/projects")({
	component: ProjectIndexContent,
	head: () => ({
		meta: [{ title: "项目索引 · 徐天成工程作品集" }],
	}),
});
