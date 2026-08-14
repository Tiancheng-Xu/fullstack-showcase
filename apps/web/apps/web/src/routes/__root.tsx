import {
	createRootRouteWithContext,
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
				title: "Tiancheng Xu · Ukiyo-e Portfolio",
			},
			{
				name: "description",
				content: "Tiancheng Xu 的浮世绘风格项目作品集，展示真实项目、工程能力与对应工作证明。",
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
	return (
		<>
			<AppShell>
				<Outlet />
			</AppShell>
			<Toaster richColors />
		</>
	);
}
