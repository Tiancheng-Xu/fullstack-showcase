import { Link } from "@tanstack/react-router";
import {
	Baby,
	Bell,
	ChevronRight,
	Cloud,
	Info,
	Moon,
	Soup,
	Sparkles,
	Users,
} from "lucide-react";
import { useState } from "react";

import { StatusChip } from "@/components/ui/status-chip";

export function ProfileContent() {
	const [reminders, setReminders] = useState(true);

	return (
		<div className="space-y-6">
			<section className="flex items-center gap-4 rounded-[2rem] bg-card p-5 shadow-card">
				<div className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
					<Users aria-hidden="true" size={34} />
				</div>
				<div>
					<h1 className="font-bold text-2xl">糯米妈妈</h1>
					<StatusChip tone="warning">
						<Sparkles aria-hidden="true" className="mr-1" size={13} />
						育爱会员
					</StatusChip>
				</div>
			</section>

			<section className="rounded-[2rem] bg-card p-5 shadow-card">
				<div className="flex items-center justify-between">
					<h2 className="font-bold">成长勋章</h2>
					<button className="text-primary text-sm" type="button">
						全部
					</button>
				</div>
				<div className="mt-5 grid grid-cols-3 gap-3 text-center">
					<Badge icon={Soup} label="辅食达人" tone="orange" />
					<Badge icon={Moon} label="好梦守护" tone="blue" />
					<Badge icon={Baby} label="蹒跚学步" tone="green" />
				</div>
			</section>

			<section className="rounded-[2rem] bg-card p-5 shadow-card">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-xl">宝宝 · 糯米</h2>
						<p className="mt-1 text-muted-foreground text-sm">1岁 2个月 15天</p>
					</div>
					<div className="grid size-12 place-items-center rounded-full bg-secondary-soft text-secondary">
						<Baby aria-hidden="true" />
					</div>
				</div>
				<div className="mt-4 flex gap-2">
					<StatusChip tone="success">天秤座</StatusChip>
					<StatusChip tone="warning">O型血</StatusChip>
				</div>
			</section>

			<section className="rounded-[2rem] bg-card p-5 shadow-card">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Cloud aria-hidden="true" className="text-primary" size={19} />
						<h2 className="font-bold">家庭时光云盘</h2>
					</div>
					<button className="text-primary text-sm" type="button">
						升级容量
					</button>
				</div>
				<div className="mt-5 flex justify-between text-muted-foreground text-xs">
					<span>已用 15.2 GB</span>
					<span>总计 50 GB</span>
				</div>
				<div
					aria-label="云盘已使用 30%"
					className="mt-2 h-3 overflow-hidden rounded-full bg-muted"
					role="progressbar"
				>
					<div className="h-full w-[30%] rounded-full bg-primary-container" />
				</div>
			</section>

			<section className="overflow-hidden rounded-[2rem] bg-card shadow-card">
				<Link
					className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50"
					to="/projects/github-profile"
				>
					<Cloud aria-hidden="true" className="text-primary" size={20} />
					<span className="flex-1 font-semibold">GitHub 个人资料</span>
					<ChevronRight
						aria-hidden="true"
						className="text-muted-foreground"
						size={18}
					/>
				</Link>
				<SettingsRow icon={Users} label="家庭成员管理" />
				<button
					aria-pressed={reminders}
					className="flex w-full items-center gap-3 border-border/45 border-t p-4 text-left hover:bg-muted/50"
					onClick={() => setReminders((current) => !current)}
					type="button"
				>
					<Bell aria-hidden="true" className="text-primary" size={20} />
					<span className="flex-1 font-semibold">消息提醒</span>
					<StatusChip tone={reminders ? "success" : "neutral"}>
						{reminders ? "已开启" : "已关闭"}
					</StatusChip>
				</button>
				<SettingsRow icon={Info} label="关于育爱成长" meta="v1.0.0" />
			</section>
		</div>
	);
}

type IconType = typeof Users;

function Badge({
	icon: Icon,
	label,
	tone,
}: {
	icon: IconType;
	label: string;
	tone: "orange" | "blue" | "green";
}) {
	const toneClass = {
		orange: "bg-primary-soft text-primary",
		blue: "bg-secondary-soft text-secondary",
		green: "bg-tertiary-soft text-tertiary",
	}[tone];
	return (
		<div>
			<div
				className={`mx-auto grid size-12 place-items-center rounded-full ${toneClass}`}
			>
				<Icon aria-hidden="true" size={22} />
			</div>
			<p className="mt-2 text-muted-foreground text-xs">{label}</p>
		</div>
	);
}

function SettingsRow({
	icon: Icon,
	label,
	meta,
}: {
	icon: IconType;
	label: string;
	meta?: string;
}) {
	return (
		<button
			className="flex w-full items-center gap-3 border-border/45 border-t p-4 text-left first:border-0 hover:bg-muted/50"
			type="button"
		>
			<Icon aria-hidden="true" className="text-secondary" size={20} />
			<span className="flex-1 font-semibold">{label}</span>
			{meta ? (
				<span className="text-muted-foreground text-xs">{meta}</span>
			) : null}
			<ChevronRight
				aria-hidden="true"
				className="text-muted-foreground"
				size={18}
			/>
		</button>
	);
}
