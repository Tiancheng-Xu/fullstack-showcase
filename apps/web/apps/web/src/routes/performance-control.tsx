import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/performance-control")({
	component: PerformanceControlRoute,
});

function PerformanceControlRoute() {
	return <Outlet />;
}
