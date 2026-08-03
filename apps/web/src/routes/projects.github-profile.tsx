import { createFileRoute } from "@tanstack/react-router";

import { GitHubProfileContent } from "@/features/github-profile/github-profile-content";

export const Route = createFileRoute("/projects/github-profile")({
	component: GitHubProfileContent,
});
