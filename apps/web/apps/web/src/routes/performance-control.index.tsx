import { createFileRoute } from "@tanstack/react-router";

import { PerformanceControlContent } from "@/features/performance/performance-control-content";

export const Route = createFileRoute("/performance-control/")({
	component: PerformanceControlIndexRoute,
	head: () => ({
		meta: [{ title: "性能观测与成本控制 · 徐天成工程作品集" }],
	}),
});

function PerformanceControlIndexRoute() {
	return <PerformanceControlContent projectId="babysteps" />;
}
