import type { PropsWithChildren } from "react";

import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

const authPaths = new Set(["/login", "/register", "/onboarding"]);

type AppShellProps = PropsWithChildren<{
	pathname?: string;
}>;

export function AppShell({ children, pathname }: AppShellProps) {
	const currentPath =
		pathname ??
		(typeof window === "undefined" ? "/growth" : window.location.pathname);
	const isAuth = authPaths.has(currentPath);

	return (
		<div className="min-h-svh bg-background text-foreground">
			<TopBar variant={isAuth ? "auth" : "app"} />
			<main
				className={
					isAuth
						? "mx-auto min-h-svh w-full max-w-lg px-6 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] pb-10"
						: "mx-auto min-h-svh w-full max-w-3xl px-5 pt-[calc(5.25rem+env(safe-area-inset-top,0px))] pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6"
				}
			>
				{children}
			</main>
			{isAuth ? null : <BottomNav />}
		</div>
	);
}
