import { createFileRoute } from "@tanstack/react-router";

import { MomentsContent } from "@/features/nurture/moments-content";

export const Route = createFileRoute("/moments")({
	component: MomentsContent,
});
