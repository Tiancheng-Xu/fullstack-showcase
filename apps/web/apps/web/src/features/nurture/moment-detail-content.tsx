import { ArrowLeft, CalendarDays, Heart, Pencil } from "lucide-react";
import { useState } from "react";

import { moments } from "./data";

export function MomentDetailContent({ momentId }: { momentId: string }) {
	const moment = moments.find((item) => item.id === momentId);
	const [favorite, setFavorite] = useState(moment?.favorite ?? false);

	if (!moment) {
		return (
			<section className="rounded-[2rem] bg-card p-7 text-center shadow-card">
				<h1 className="font-bold text-2xl">没有找到这段时光</h1>
				<p className="mt-2 text-muted-foreground">它可能还没有被添加到相册。</p>
				<a
					className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary-container px-5 font-bold text-primary"
					href="/moments"
				>
					返回家庭时光
				</a>
			</section>
		);
	}

	return (
		<article className="space-y-6">
			<div className="flex items-center justify-between">
				<a
					aria-label="返回家庭时光"
					className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow-card"
					href="/moments"
				>
					<ArrowLeft aria-hidden="true" size={20} />
				</a>
				<button
					aria-label="编辑这段时光"
					className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow-card"
					type="button"
				>
					<Pencil aria-hidden="true" size={18} />
				</button>
			</div>

			<div className="relative aspect-[4/5] overflow-hidden rounded-[2.25rem] bg-surface-low shadow-card">
				<img
					alt={moment.title}
					className="size-full object-cover"
					src={moment.image}
				/>
				<button
					aria-label={`收藏 ${moment.title}`}
					aria-pressed={favorite}
					className="absolute right-4 bottom-4 grid size-12 place-items-center rounded-full bg-white/85 text-primary shadow-card backdrop-blur"
					onClick={() => setFavorite((current) => !current)}
					type="button"
				>
					<Heart
						aria-hidden="true"
						fill={favorite ? "currentColor" : "none"}
						size={22}
					/>
				</button>
			</div>

			<section className="rounded-[2rem] bg-card p-6 shadow-card">
				<p className="flex items-center gap-2 text-muted-foreground text-sm">
					<CalendarDays aria-hidden="true" size={16} />
					{moment.date}
				</p>
				<h1 className="mt-3 font-bold text-3xl tracking-[-0.04em]">
					{moment.title}
				</h1>
				<p className="mt-4 text-foreground/80 leading-7">
					{moment.description}
				</p>
				<div className="mt-5 flex flex-wrap gap-2">
					{moment.tags?.map((tag) => (
						<span
							className="rounded-full bg-primary-soft px-3 py-1.5 font-semibold text-primary text-xs"
							key={tag}
						>
							{tag}
						</span>
					))}
				</div>
			</section>
		</article>
	);
}
