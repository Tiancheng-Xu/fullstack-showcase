import type { PropsWithChildren } from "react";

import { cn } from "@/lib/cn";

type StatusChipProps = PropsWithChildren<{
	tone?: "success" | "info" | "warning" | "neutral";
}>;

const toneClasses = {
	success: "bg-tertiary-container/70 text-tertiary",
	info: "bg-secondary-container/70 text-secondary",
	warning: "bg-primary-soft/75 text-primary",
	neutral: "bg-muted text-muted-foreground",
} as const;

export function StatusChip({ children, tone = "info" }: StatusChipProps) {
	return (
		<span
			className={cn(
				"inline-flex min-h-7 items-center rounded-full px-2.5 py-1 font-semibold text-xs",
				toneClasses[tone],
			)}
			data-tone={tone}
		>
			{children}
		</span>
	);
}
