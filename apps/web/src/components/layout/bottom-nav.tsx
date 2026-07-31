import { Link } from "@tanstack/react-router";
import { BookOpen, Images, Sprout, UserRound } from "lucide-react";

const items = [
	{ to: "/growth", label: "成长", icon: Sprout },
	{ to: "/moments", label: "时光", icon: Images },
	{ to: "/guide", label: "百科", icon: BookOpen },
	{ to: "/me", label: "我的", icon: UserRound },
] as const;

export function BottomNav() {
	return (
		<nav
			aria-label="主要导航"
			className="fixed inset-x-0 bottom-0 z-50 border-border/45 border-t bg-background/90 pb-safe backdrop-blur-xl"
		>
			<div className="mx-auto grid h-16 w-full max-w-3xl grid-cols-4 px-2">
				{items.map(({ icon: Icon, label, to }) => (
					<Link
						activeProps={{
							"aria-current": "page",
							className: "font-bold text-primary",
						}}
						className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-muted-foreground text-xs transition-colors hover:bg-muted/70 hover:text-foreground"
						key={to}
						to={to}
					>
						<Icon aria-hidden="true" size={21} strokeWidth={2.2} />
						<span>{label}</span>
					</Link>
				))}
			</div>
		</nav>
	);
}
