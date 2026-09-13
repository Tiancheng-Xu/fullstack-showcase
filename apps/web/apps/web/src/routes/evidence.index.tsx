import { createFileRoute } from "@tanstack/react-router";

import { EvidenceIndexContent } from "@/features/portfolio/evidence-index-content";

export const Route = createFileRoute("/evidence/")({
	component: EvidenceIndexContent,
	head: () => ({
		meta: [{ title: "工作证明 · 徐天成工程作品集" }],
	}),
});
