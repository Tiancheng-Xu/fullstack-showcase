import {
	CheckCircle2,
	Search,
	ShieldPlus,
	Sparkles,
	Syringe,
} from "lucide-react";
import { useMemo, useState } from "react";

import { StatusChip } from "@/components/ui/status-chip";
import { guideItems } from "./data";
import type { GuideCategory } from "./types";

const categories: GuideCategory[] = ["全部", "喂养", "护理", "疫苗", "早教"];

export function GuideContent() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<GuideCategory>("全部");
	const filtered = useMemo(
		() =>
			guideItems.filter(
				(item) =>
					(category === "全部" || item.category === category) &&
					`${item.title}${item.description}`.includes(query.trim()),
			),
		[category, query],
	);

	return (
		<div className="space-y-7">
			<section>
				<h1 className="font-bold text-2xl tracking-[-0.03em]">育儿百科</h1>
				<p className="mt-1 text-muted-foreground">把靠谱知识，变成安心陪伴</p>
			</section>

			<label className="relative block">
				<span className="sr-only">搜索育儿知识</span>
				<Search
					aria-hidden="true"
					className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
					size={20}
				/>
				<input
					className="h-14 w-full rounded-2xl bg-surface-high pr-4 pl-12 outline-none transition-shadow focus:ring-2 focus:ring-secondary/45"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="搜索育儿知识..."
					value={query}
				/>
			</label>

			<div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
				{categories.map((item) => (
					<button
						aria-pressed={item === category}
						className="h-10 shrink-0 rounded-full bg-muted px-5 font-semibold text-muted-foreground text-sm aria-pressed:bg-primary-soft aria-pressed:text-primary"
						key={item}
						onClick={() => setCategory(item)}
						type="button"
					>
						{item}
					</button>
				))}
			</div>

			<section className="relative overflow-hidden rounded-[2rem] bg-error-container p-6 text-on-error-container shadow-card">
				<div className="relative z-10 max-w-[75%]">
					<div className="flex items-center justify-between gap-2 text-xs">
						<StatusChip tone="warning">本月精选</StatusChip>
						<span>3分钟阅读</span>
					</div>
					<h2 className="mt-5 font-bold text-2xl leading-tight">
						6个月宝宝辅食添加指南：第一口吃什么？
					</h2>
				</div>
				<Sparkles
					aria-hidden="true"
					className="absolute right-3 bottom-2 opacity-20"
					size={96}
				/>
			</section>

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-xl">疫苗接种日程</h2>
					<button className="font-semibold text-primary text-sm" type="button">
						全部日程
					</button>
				</div>
				<VaccineRow complete title="五联疫苗（第一针）" />
				<VaccineRow complete={false} title="乙肝疫苗（第三针）" />
			</section>

			<section className="space-y-3">
				<h2 className="font-bold text-xl">每日小贴士</h2>
				{filtered.length > 0 ? (
					filtered.map((item) => (
						<article
							className="flex gap-4 rounded-3xl bg-card p-4 shadow-card"
							key={item.id}
						>
							<div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-soft text-secondary">
								<ShieldPlus aria-hidden="true" size={20} />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">{item.category}</p>
								<h3 className="mt-0.5 font-bold">{item.title}</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{item.description}
								</p>
							</div>
						</article>
					))
				) : (
					<p className="rounded-3xl bg-card p-6 text-center text-muted-foreground">
						没有找到相关内容
					</p>
				)}
			</section>
		</div>
	);
}

function VaccineRow({ complete, title }: { complete: boolean; title: string }) {
	return (
		<article className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card">
			<div className="grid size-11 place-items-center rounded-full bg-tertiary-soft text-tertiary">
				{complete ? (
					<CheckCircle2 aria-hidden="true" size={21} />
				) : (
					<Syringe aria-hidden="true" size={21} />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="truncate font-bold">{title}</h3>
				<p className="text-muted-foreground text-xs">
					{complete ? "2个月龄接种" : "6个月龄接种 · 建议本周完成"}
				</p>
			</div>
			<StatusChip tone={complete ? "success" : "warning"}>
				{complete ? "已完成" : "待打卡"}
			</StatusChip>
		</article>
	);
}
