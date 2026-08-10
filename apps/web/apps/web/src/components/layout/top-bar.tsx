import { Bell, UserRound } from "lucide-react";

import { STITCH_ASSETS } from "@/features/nurture/stitch-assets";

export function TopBar({ variant = "app" }: { variant?: "auth" | "app" }) {
	return (
		<header className="fixed inset-x-0 top-0 z-50 bg-background/92 pt-safe backdrop-blur-xl">
			<div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-6">
				<div className="flex items-center gap-2.5">
					<img
						alt="育爱成长"
						className="size-9 rounded-xl object-cover mix-blend-multiply"
						src={STITCH_ASSETS.logo}
					/>
					<span className="font-bold text-primary text-xl tracking-[-0.02em]">
						育爱成长
					</span>
				</div>
				{variant === "auth" ? (
					<span className="rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary text-xs">
						温柔记录每一步
					</span>
				) : (
					<div className="flex items-center gap-2">
						<button
							aria-label="通知"
							className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							type="button"
						>
							<Bell aria-hidden="true" size={21} />
						</button>
						<div
							aria-label="个人资料"
							className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
							role="img"
						>
							<UserRound aria-hidden="true" size={19} />
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
