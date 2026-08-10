import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EditBabyContent } from "@/features/nurture/edit-baby-content";

export const Route = createFileRoute("/me_/baby")({
	component: EditBabyPage,
});

function EditBabyPage() {
	const navigate = useNavigate();
	return <EditBabyContent onSave={() => navigate({ to: "/me" })} />;
}
