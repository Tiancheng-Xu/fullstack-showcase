import { createFileRoute } from "@tanstack/react-router";

import { PerformanceControlContent } from "@/features/performance/performance-control-content";

type PerformanceControlSearch = {
	project: string;
};

export const Route = createFileRoute("/performance-control")({
	validateSearch: (search: Record<string, unknown>): PerformanceControlSearch => ({
		project: typeof search.project === "string" ? search.project : "",
	}),
	component: PerformanceControlRoute,
});

function PerformanceControlRoute() {
	const { project } = Route.useSearch();

	return <PerformanceControlContent projectId={project} />;
}
