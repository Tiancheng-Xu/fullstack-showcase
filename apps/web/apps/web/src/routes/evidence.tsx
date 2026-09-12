import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/evidence")({
	component: EvidenceRoute,
});

function EvidenceRoute() {
	return <Outlet />;
}
