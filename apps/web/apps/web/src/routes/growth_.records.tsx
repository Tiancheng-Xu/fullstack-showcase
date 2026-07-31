import { createFileRoute } from "@tanstack/react-router";

import { GrowthRecordsContent } from "@/features/nurture/growth-records-content";

export const Route = createFileRoute("/growth_/records")({
	component: GrowthRecordsContent,
});
