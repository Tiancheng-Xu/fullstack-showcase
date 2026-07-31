import {
	Baby,
	Bell,
	ChevronRight,
	Info,
	LogOut,
	Moon,
	ShieldCheck,
	Soup,
	Users,
} from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { StatusChip } from "@/components/ui/status-chip";
import { babyProfile } from "./data";
import { STITCH_ASSETS } from "./stitch-assets";

export function ProfileContent({
	onLogout = () => {},
}: {
	onLogout?: () => void;
}) {
	const [reminders, setReminders] = useState(true);
	const [logoutOpen, setLogoutOpen] = useState(false);

	return (
		<div className="space-y-6">
			<section>
				<p className="font-semibold text-primary text-sm">家庭空间</p>
				<h1 className="mt-1 font-bold text-3xl tracking-[-0.04em]">我的</h1>
			</section>

			<section className="flex items-center gap-4 rounded-[2rem] bg-card p-5 shadow-card">
				<img
					alt="金金妈妈的头像"
					className="size-20 rounded-full object-cover"
					src={STITCH_ASSETS.profileMother}
				/>
				<div>
					<h2 className="font-bold text-2xl">金金妈妈</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						已陪伴宝宝记录 198 天
					</p>
				</div>
			</section>

			<section className="rounded-[2rem] bg-card p-5 shadow-card">
				<div className="flex items-center justify-between">
					<h2 className="font-bold">成长勋章</h2>
					<span className="text-muted-foreground text-sm">3 枚</span>
				</div>
				<div className="mt-5 grid grid-cols-3 gap-3 text-center">
					<Badge icon={Soup} label="辅食达人" tone="orange" />
					<Badge icon={Moon} label="好梦守护" tone="blue" />
					<Badge icon={Baby} label="成长记录" tone="green" />
				</div>
			</section>

			<section className="rounded-[2rem] bg-card p-5 shadow-card">
				<div className="flex items-center gap-4">
					<img
						alt={`${babyProfile.nickname}的头像`}
						className="size-16 rounded-full object-cover"
						src={STITCH_ASSETS.profileBaby}
					/>
					<div className="min-w-0 flex-1">
						<h2 className="font-bold text-xl">宝宝 · {babyProfile.nickname}</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							{babyProfile.ageDisplay} · {babyProfile.heightCm} cm ·{" "}
							{babyProfile.weightKg} kg
						</p>
					</div>
				</div>
				<div className="mt-4 flex items-center justify-between border-border/55 border-t pt-4">
					<div className="flex gap-2">
						<StatusChip tone="success">{babyProfile.gender}宝</StatusChip>
						<StatusChip tone="warning">{babyProfile.bloodType}型血</StatusChip>
					</div>
					<a
						className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-primary text-sm"
						href="/me/baby"
					>
						编辑宝宝资料
						<ChevronRight aria-hidden="true" size={17} />
					</a>
				</div>
			</section>

			<section className="overflow-hidden rounded-[2rem] bg-card shadow-card">
				<SettingsRow icon={Users} label="家庭成员" meta="后续开放" />
				<button
					aria-checked={reminders}
					aria-label="消息提醒"
					className="group flex min-h-14 w-full items-center gap-3 border-border/45 border-t p-4 text-left hover:bg-muted/50"
					onClick={() => setReminders((current) => !current)}
					role="switch"
					type="button"
				>
					<Bell aria-hidden="true" className="text-primary" size={20} />
					<span className="flex-1 font-semibold">消息提醒</span>
					<span className="relative h-7 w-12 rounded-full bg-muted transition group-aria-checked:bg-primary-container">
						<span className="absolute top-1 left-1 size-5 rounded-full bg-card shadow-sm transition group-aria-checked:translate-x-5" />
					</span>
				</button>
				<SettingsRow icon={ShieldCheck} label="数据与隐私" />
				<SettingsRow icon={Info} label="关于育爱成长" meta="v1.0.0" />
			</section>

			<button
				className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-error-container font-bold text-destructive"
				onClick={() => setLogoutOpen(true)}
				type="button"
			>
				<LogOut aria-hidden="true" size={19} />
				退出登录
			</button>

			<Modal
				onClose={() => setLogoutOpen(false)}
				open={logoutOpen}
				title="确认退出登录？"
			>
				<p className="text-muted-foreground leading-6">
					退出后仍会保留本地课程演示数据，下次登录可继续查看。
				</p>
				<div className="mt-5 grid grid-cols-2 gap-3">
					<button
						className="min-h-12 rounded-full bg-muted font-bold"
						onClick={() => setLogoutOpen(false)}
						type="button"
					>
						暂不退出
					</button>
					<button
						className="min-h-12 rounded-full bg-destructive font-bold text-white"
						onClick={onLogout}
						type="button"
					>
						确认退出
					</button>
				</div>
			</Modal>
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
			className="flex min-h-14 w-full items-center gap-3 border-border/45 border-t p-4 text-left first:border-0 hover:bg-muted/50"
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
