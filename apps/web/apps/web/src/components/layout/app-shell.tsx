import type { PropsWithChildren } from "react";

import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

export function AppShell({ children }: PropsWithChildren) {
	return (
		<div className="min-h-svh bg-background text-foreground">
			<TopBar />
			<main className="mx-auto min-h-svh w-full max-w-3xl px-5 pt-[calc(5rem+env(safe-area-inset-top,0px))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6">
				{children}
			</main>
			<BottomNav />
		</div>
	);
}
