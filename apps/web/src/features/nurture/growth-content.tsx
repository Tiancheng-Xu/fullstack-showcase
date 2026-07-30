import {
	Activity,
	Baby,
	BedDouble,
	CheckCircle2,
	Milk,
	Ruler,
	Scale,
	Syringe,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusChip } from "@/components/ui/status-chip";
import { initialRecords } from "./data";
import type { DailyRecord, RecordKind } from "./types";

const recordUnits: Record<RecordKind, string> = {
	喂奶: "ml",
	睡眠: "h",
	身高: "cm",
	体重: "kg",
};

export function GrowthContent() {
	const [records, setRecords] = useState(initialRecords);
	const [modalOpen, setModalOpen] = useState(false);
	const [kind, setKind] = useState<RecordKind>("喂奶");
	const [value, setValue] = useState("180");

	function addRecord(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const next: DailyRecord = {
			id: crypto.randomUUID(),
			kind,
			value: `${value} ${recordUnits[kind]}`,
			time: "刚刚",
		};
		setRecords((current) => [next, ...current]);
		setModalOpen(false);
	}

	return (
		<div className="space-y-8">
			<section>
				<p className="font-semibold text-muted-foreground text-sm">早安</p>
				<h1 className="mt-1 font-bold text-2xl text-primary tracking-[-0.03em]">
					宝贝的小世界
				</h1>
				<p className="mt-1 text-muted-foreground">糯米 · 6个月15天</p>
			</section>

			<section className="space-y-4">
				<SectionHeader title="生长曲线" />
				<div className="grid grid-cols-2 gap-3">
					<MetricCard
						color="blue"
						icon={Ruler}
						label="身高"
						unit="cm"
						value="68"
					/>
					<MetricCard
						color="orange"
						icon={Scale}
						label="体重"
						unit="kg"
						value="8.5"
					/>
				</div>
			</section>

			<section className="space-y-4">
				<SectionHeader actionLabel="查看全部" title="里程碑" />
				<div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
					<Milestone icon={Baby} meta="6个月达成" title="会坐了" tone="green" />
					<Milestone
						icon={Activity}
						meta="5个月达成"
						title="开始萌牙"
						tone="blue"
					/>
					<Milestone
						icon={CheckCircle2}
						meta="等待惊喜"
						title="解锁新技能"
						tone="neutral"
					/>
				</div>
			</section>

			<section className="flex items-center gap-4 rounded-[2rem] bg-error-container p-5 text-on-error-container">
				<div className="grid size-12 shrink-0 place-items-center rounded-full bg-card">
					<Syringe aria-hidden="true" />
				</div>
				<div className="min-w-0 flex-1">
					<h2 className="font-bold text-lg">下次疫苗</h2>
					<p className="truncate text-sm opacity-80">乙肝疫苗（第3剂）</p>
				</div>
				<p className="font-bold text-2xl">
					3<span className="ml-1 text-sm">天后</span>
				</p>
			</section>

			<section className="space-y-4">
				<SectionHeader
					actionLabel="添加记录"
					onAction={() => setModalOpen(true)}
					title="今日记录"
				/>
				<div className="space-y-3">
					{records.map((record) => (
						<RecordRow key={record.id} record={record} />
					))}
				</div>
			</section>

			<Modal
				onClose={() => setModalOpen(false)}
				open={modalOpen}
				title="添加记录"
			>
				<form className="space-y-4" onSubmit={addRecord}>
					<label className="grid gap-2 font-semibold text-sm">
						记录类型
						<select
							className="h-14 rounded-2xl bg-muted px-4 outline-none focus:ring-2 focus:ring-secondary"
							onChange={(event) => setKind(event.target.value as RecordKind)}
							value={kind}
						>
							{Object.keys(recordUnits).map((item) => (
								<option key={item}>{item}</option>
							))}
						</select>
					</label>
					<label className="grid gap-2 font-semibold text-sm">
						记录数值
						<input
							className="h-14 rounded-2xl bg-muted px-4 outline-none focus:ring-2 focus:ring-secondary"
							inputMode="decimal"
							onChange={(event) => setValue(event.target.value)}
							required
							value={value}
						/>
					</label>
					<button
						className="h-14 w-full rounded-full bg-primary-container font-bold text-primary shadow-card"
						type="submit"
					>
						保存记录
					</button>
				</form>
			</Modal>
		</div>
	);
}

type IconType = typeof Ruler;

function MetricCard({
	color,
	icon: Icon,
	label,
	unit,
	value,
}: {
	color: "blue" | "orange";
	icon: IconType;
	label: string;
	unit: string;
	value: string;
}) {
	const styles =
		color === "blue"
			? "bg-secondary-soft text-secondary"
			: "bg-primary-soft text-primary";
	return (
		<article className="relative overflow-hidden rounded-[2rem] bg-card p-5 shadow-card">
			<div className={`grid size-9 place-items-center rounded-full ${styles}`}>
				<Icon aria-hidden="true" size={18} />
			</div>
			<p className="mt-3 text-muted-foreground text-sm">{label}</p>
			<p className="mt-1 font-bold text-3xl">
				{value}
				<span className="ml-1 font-medium text-muted-foreground text-sm">
					{unit}
				</span>
			</p>
			<StatusChip tone="success">正常</StatusChip>
		</article>
	);
}

function Milestone({
	icon: Icon,
	meta,
	title,
	tone,
}: {
	icon: IconType;
	meta: string;
	title: string;
	tone: "green" | "blue" | "neutral";
}) {
	const toneClass = {
		green: "bg-tertiary-soft text-tertiary",
		blue: "bg-secondary-soft text-secondary",
		neutral: "bg-muted text-muted-foreground",
	}[tone];
	return (
		<article className="w-40 shrink-0 snap-start rounded-3xl bg-card p-4 text-center shadow-card">
			<div
				className={`mx-auto grid size-12 place-items-center rounded-full ${toneClass}`}
			>
				<Icon aria-hidden="true" />
			</div>
			<h3 className="mt-3 font-bold">{title}</h3>
			<p className="mt-1 text-muted-foreground text-xs">{meta}</p>
		</article>
	);
}

function RecordRow({ record }: { record: DailyRecord }) {
	const Icon = record.kind === "睡眠" ? BedDouble : Milk;
	return (
		<article className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card">
			<div className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
				<Icon aria-hidden="true" size={20} />
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="font-bold">{record.kind}</h3>
				<p className="text-muted-foreground text-xs">{record.time}</p>
			</div>
			<p className="font-bold text-lg text-primary">{record.value}</p>
		</article>
	);
}
