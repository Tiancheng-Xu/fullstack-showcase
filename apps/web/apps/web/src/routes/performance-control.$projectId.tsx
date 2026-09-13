import { createFileRoute } from "@tanstack/react-router";

import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import { PerformanceControlContent } from "@/features/performance/performance-control-content";

export const Route = createFileRoute("/performance-control/$projectId")({
	component: PerformanceControlProjectRoute,
	head: ({ params }) => ({
		meta: [
			{
				title: `${PROJECTS_INDEX[params.projectId]?.title ?? "项目"}性能观测 · 徐天成工程作品集`,
			},
		],
	}),
});

function PerformanceControlProjectRoute() {
	const { projectId } = Route.useParams();

	return <PerformanceControlContent projectId={projectId} />;
}
