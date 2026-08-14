import { createFileRoute } from "@tanstack/react-router";

import { EvidenceContent } from "@/features/portfolio/evidence-content";

export const Route = createFileRoute("/evidence/$projectId")({
	component: () => {
		const { projectId } = Route.useParams();

		return <EvidenceContent projectId={projectId} />;
	},
});

