import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/features/portfolio/dashboard-content";

export const Route = createFileRoute("/dashboard")({
	component: DashboardContent,
});

