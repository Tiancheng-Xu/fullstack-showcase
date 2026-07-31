import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@web/ui/components/sonner";

import { AppShell } from "@/components/layout/app-shell";

import "../index.css";

export type RouterAppContext = Record<never, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "育爱成长",
			},
			{
				name: "description",
				content: "温暖、轻盈的宝宝成长记录应用",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<>
			<HeadContent />
			<AppShell pathname={pathname}>
				<Outlet />
			</AppShell>
			<Toaster richColors />
		</>
	);
}
