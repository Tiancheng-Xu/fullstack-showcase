import { createFileRoute } from "@tanstack/react-router";

import { PerformanceControlContent } from "@/features/performance/performance-control-content";

export const Route = createFileRoute("/performance-control/$projectId")({
	component: PerformanceControlProjectRoute,
});

function PerformanceControlProjectRoute() {
	const { projectId } = Route.useParams();

	return <PerformanceControlContent projectId={projectId} />;
}
