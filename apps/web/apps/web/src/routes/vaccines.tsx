import { createFileRoute } from "@tanstack/react-router";

import { VaccineContent } from "@/features/nurture/vaccine-content";

export const Route = createFileRoute("/vaccines")({
	component: VaccineContent,
});
