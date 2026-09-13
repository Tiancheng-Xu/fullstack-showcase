import { createFileRoute } from "@tanstack/react-router";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import { EvidenceContent } from "@/features/portfolio/evidence-content";

export const Route = createFileRoute("/evidence/$projectId")({
	head: ({ params }) => ({
		meta: [
			{
				title: `${PROJECTS_INDEX[params.projectId]?.title ?? "项目"}工作证明 · 徐天成工程作品集`,
			},
		],
	}),
	component: () => {
		const { projectId } = Route.useParams();

		return <EvidenceContent projectId={projectId} />;
	},
});
