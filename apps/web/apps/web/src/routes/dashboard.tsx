import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/features/portfolio/dashboard-content";

export const Route = createFileRoute("/dashboard")({
	component: DashboardContent,
	head: () => ({
		meta: [{ title: "徐天成工程作品集" }],
	}),
});
