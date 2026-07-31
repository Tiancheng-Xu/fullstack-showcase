import {
	BedDouble,
	ChartNoAxesColumnIncreasing,
	Milk,
	MoreHorizontal,
	Ruler,
	Scale,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { growthRecords } from "./data";
import type { DailyRecord, RecordKind } from "./types";

type Filter = "全部" | "喂养" | "睡眠" | "成长";

const filters: Filter[] = ["全部", "喂养", "睡眠", "成长"];

export function GrowthRecordsContent() {
	const [records, setRecords] = useState(growthRecords);
	const [filter, setFilter] = useState<Filter>("全部");
	const [deleting, setDeleting] = useState<DailyRecord | null>(null);
	const visible = useMemo(
		() =>
			records.filter((record) => {
				if (filter === "全部") return true;
				if (filter === "喂养") return record.kind === "喂奶";
				if (filter === "睡眠") return record.kind === "睡眠";
				return record.kind === "身高" || record.kind === "体重";
			}),
		[filter, records],
	);

	function confirmDelete() {
		if (!deleting) return;
		setRecords((current) =>
			current.filter((record) => record.id !== deleting.id),
		);
		setDeleting(null);
	}

	return (
		<div className="space-y-6">
			<header>
				<p className="font-semibold text-primary text-sm">今天回顾</p>
				<h1 className="mt-1 font-bold text-3xl tracking-[-0.04em]">成长点滴</h1>
				<p className="mt-2 text-muted-foreground">每一次记录，都是爱的证据。</p>
			</header>

			<div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
				{filters.map((item) => (
					<button
						aria-pressed={filter === item}
						className="h-10 shrink-0 rounded-full bg-card px-5 font-bold text-muted-foreground text-sm shadow-sm aria-pressed:bg-primary aria-pressed:text-white"
						key={item}
						onClick={() => setFilter(item)}
						type="button"
					>
						{item}
					</button>
				))}
			</div>

			<section className="relative space-y-3 before:absolute before:top-7 before:bottom-7 before:left-[1.4rem] before:w-px before:bg-border/60">
				{visible.length > 0 ? (
					visible.map((record) => (
						<RecordCard
							key={record.id}
							onDelete={() => setDeleting(record)}
							record={record}
						/>
					))
				) : (
					<div className="rounded-[2rem] bg-card p-8 text-center text-muted-foreground shadow-card">
						<ChartNoAxesColumnIncreasing className="mx-auto mb-3" />
						该分类还没有记录
					</div>
				)}
			</section>

			<Modal
				onClose={() => setDeleting(null)}
				open={Boolean(deleting)}
				title="删除这条记录？"
			>
				<p className="text-muted-foreground leading-6">
					删除后不会出现在成长时间线中。此本地演示操作无法撤销。
				</p>
				<div className="mt-6 grid grid-cols-2 gap-3">
					<button
						className="h-12 rounded-full bg-muted font-bold"
						onClick={() => setDeleting(null)}
						type="button"
					>
						取消
					</button>
					<button
						className="h-12 rounded-full bg-destructive font-bold text-white"
						onClick={confirmDelete}
						type="button"
					>
						确认删除
					</button>
				</div>
			</Modal>
		</div>
	);
}

const iconByKind: Record<RecordKind, typeof Milk> = {
	喂奶: Milk,
	睡眠: BedDouble,
	身高: Ruler,
	体重: Scale,
};

function RecordCard({
	onDelete,
	record,
}: {
	onDelete: () => void;
	record: DailyRecord;
}) {
	const Icon = iconByKind[record.kind];
	return (
		<article className="relative z-10 ml-0 flex gap-3 rounded-[1.75rem] bg-card p-4 shadow-card">
			<div className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-primary ring-4 ring-background">
				<Icon aria-hidden="true" size={19} />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="font-bold">{record.kind}</h2>
						<p className="text-muted-foreground text-xs">{record.time}</p>
					</div>
					<p className="font-bold text-primary text-xl">{record.value}</p>
				</div>
				{record.note ? (
					<p className="mt-3 rounded-xl bg-surface-low p-3 text-muted-foreground text-sm">
						{record.note}
					</p>
				) : null}
			</div>
			<button
				aria-label={`删除 ${record.kind}`}
				className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-error-container hover:text-destructive"
				onClick={onDelete}
				type="button"
			>
				<Trash2 aria-hidden="true" size={17} />
			</button>
			<MoreHorizontal className="sr-only" />
		</article>
	);
}
