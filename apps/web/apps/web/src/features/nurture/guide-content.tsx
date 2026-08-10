import {
	ArrowRight,
	CheckCircle2,
	Search,
	ShieldPlus,
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
	const featured = guideItems.find((item) => item.id === "feeding");
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
				<p className="font-semibold text-primary text-sm">中国家长适用</p>
				<h1 className="mt-1 font-bold text-3xl tracking-[-0.04em]">育儿百科</h1>
				<p className="mt-1 text-muted-foreground">
					优先采用国内权威公开资料，每篇都标注来源
				</p>
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

			{featured ? (
				<a
					className="group relative block min-h-64 overflow-hidden rounded-[2rem] bg-error-container shadow-card"
					href={`/guide/${featured.id}`}
				>
					<img
						alt=""
						className="absolute inset-0 size-full object-cover"
						src={featured.image}
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
					<div className="relative z-10 flex min-h-64 max-w-[78%] flex-col justify-between p-6 text-white">
						<div className="flex items-center gap-2 text-xs">
							<StatusChip tone="warning">本月精选</StatusChip>
							<span>{featured.readingMinutes}分钟阅读</span>
						</div>
						<div>
							<h2 className="font-bold text-2xl leading-tight">
								6个月宝宝辅食添加指南：第一口吃什么？
							</h2>
							<span className="mt-4 inline-flex items-center gap-1 font-bold text-sm">
								阅读全文
								<ArrowRight
									aria-hidden="true"
									className="transition group-hover:translate-x-1"
									size={17}
								/>
							</span>
						</div>
					</div>
				</a>
			) : null}

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-xl">疫苗接种日程</h2>
					<a className="font-semibold text-primary text-sm" href="/vaccines">
						全部日程
					</a>
				</div>
				<VaccineRow complete title="五联疫苗（第一针）" />
				<VaccineRow complete={false} title="乙肝疫苗（第三针）" />
			</section>

			<section className="space-y-3">
				<h2 className="font-bold text-xl">每日小贴士</h2>
				{filtered.length > 0 ? (
					filtered.map((item) => (
						<a
							className="flex gap-4 rounded-3xl bg-card p-4 shadow-card transition active:scale-[0.99]"
							href={`/guide/${item.id}`}
							key={item.id}
						>
							<div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-soft text-secondary">
								<ShieldPlus aria-hidden="true" size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-muted-foreground text-xs">
									{item.category} · {item.readingMinutes}分钟
								</p>
								<h3 className="mt-0.5 font-bold">{item.title}</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{item.description}
								</p>
								<p className="mt-2 truncate text-muted-foreground text-xs">
									来源：{item.sourceName}
								</p>
							</div>
						</a>
					))
				) : (
					<div className="rounded-3xl bg-card p-6 text-center">
						<p className="font-bold">没有找到相关内容</p>
						<p className="mt-1 text-muted-foreground text-sm">
							试试缩短关键词或切换到“全部”
						</p>
					</div>
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
