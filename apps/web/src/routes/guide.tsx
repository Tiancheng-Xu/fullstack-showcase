import { createFileRoute } from "@tanstack/react-router";

import { GuideContent } from "@/features/nurture/guide-content";

export const Route = createFileRoute("/guide")({
	component: GuideContent,
});
