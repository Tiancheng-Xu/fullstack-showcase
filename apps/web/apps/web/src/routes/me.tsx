import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ProfileContent } from "@/features/nurture/profile-content";

export const Route = createFileRoute("/me")({
	component: ProfilePage,
});

function ProfilePage() {
	const navigate = useNavigate();
	return <ProfileContent onLogout={() => navigate({ to: "/login" })} />;
}
