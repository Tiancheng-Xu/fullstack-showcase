import { createFileRoute } from "@tanstack/react-router";

import { ProjectIndexContent } from "@/features/portfolio/project-index-content";

export const Route = createFileRoute("/projects")({
	component: ProjectIndexContent,
});
