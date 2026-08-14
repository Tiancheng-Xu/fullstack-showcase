import { Bell, BriefcaseBusiness, UserRound } from "lucide-react";

export function TopBar() {
	return (
		<header className="fixed inset-x-0 top-0 z-50 border-border/45 border-b bg-background/86 pt-safe backdrop-blur-xl">
			<div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-6">
				<div className="flex items-center gap-2.5">
					<div
						aria-hidden="true"
						className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"
					>
						<BriefcaseBusiness aria-hidden="true" size={20} />
					</div>
					<div className="space-y-0.5">
						<div className="font-bold text-primary text-xl tracking-[-0.02em]">
							Showcase Dashboard
						</div>
						<div className="text-muted-foreground text-[11px]">
							作者：Tiancheng Xu（Tiancheng-Xu）
						</div>
					</div>
				</div>
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
			</div>
		</header>
	);
}
