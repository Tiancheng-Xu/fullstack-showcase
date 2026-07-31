import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { OnboardingContent } from "@/features/nurture/auth-pages";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	return <OnboardingContent onSuccess={() => navigate({ to: "/growth" })} />;
}
