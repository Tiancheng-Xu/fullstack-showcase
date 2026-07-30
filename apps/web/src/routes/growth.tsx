import { createFileRoute } from "@tanstack/react-router";

import { GrowthContent } from "@/features/nurture/growth-content";

export const Route = createFileRoute("/growth")({
	component: GrowthContent,
});
