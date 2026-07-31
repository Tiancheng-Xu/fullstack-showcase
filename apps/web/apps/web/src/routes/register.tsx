import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RegisterContent } from "@/features/nurture/auth-pages";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	return <RegisterContent onSuccess={() => navigate({ to: "/onboarding" })} />;
}
