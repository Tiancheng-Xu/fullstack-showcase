import { createFileRoute } from "@tanstack/react-router";

import { OpenSourceIndexContent } from "@/features/portfolio/open-source-index-content";

export const Route = createFileRoute("/open-source")({
	component: OpenSourceIndexContent,
});
