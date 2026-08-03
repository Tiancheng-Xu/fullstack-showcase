import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/homework/github-profile")({
	beforeLoad: () => {
		throw redirect({
			to: "/projects/github-profile",
			replace: true,
		});
	},
});
