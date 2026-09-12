import { createFileRoute } from "@tanstack/react-router";

import { EvidenceIndexContent } from "@/features/portfolio/evidence-index-content";

export const Route = createFileRoute("/evidence/")({
	component: EvidenceIndexContent,
});
