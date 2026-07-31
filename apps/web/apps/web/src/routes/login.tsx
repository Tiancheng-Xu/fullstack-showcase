import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LoginContent } from "@/features/nurture/auth-pages";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	return <LoginContent onSuccess={() => navigate({ to: "/growth" })} />;
}
