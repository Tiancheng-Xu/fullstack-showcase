import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
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
				title: "徐天成工程作品集",
			},
			{
				name: "description",
				content: "Tiancheng Xu 的浮世绘风格项目作品集，展示真实项目、工程能力与对应工作证明。",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<AppShell>
				<Outlet />
			</AppShell>
			<Toaster richColors />
		</>
	);
}
