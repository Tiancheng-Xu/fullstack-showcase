import { createFileRoute } from "@tanstack/react-router";

import { ProfileContent } from "@/features/nurture/profile-content";

export const Route = createFileRoute("/me")({
	component: ProfileContent,
});
