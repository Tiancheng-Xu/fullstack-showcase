import { createFileRoute } from "@tanstack/react-router";

import { PerformanceControlContent } from "@/features/performance/performance-control-content";

export const Route = createFileRoute("/performance-control")({
	component: PerformanceControlRoute,
});

function PerformanceControlRoute() {
	return <PerformanceControlContent projectId="babysteps" />;
}
