import { Bell, CheckCircle2, Clock3, ShieldCheck, Syringe } from "lucide-react";
import { useState } from "react";

import { vaccines as initialVaccines } from "./data";

export function VaccineContent() {
	const [vaccines, setVaccines] = useState(initialVaccines);

	function toggleReminder(id: string) {
		setVaccines((current) =>
			current.map((vaccine) =>
				vaccine.id === id
					? { ...vaccine, reminderEnabled: !vaccine.reminderEnabled }
					: vaccine,
			),
		);
	}

	return (
		<div className="space-y-6">
			<header className="rounded-[2rem] bg-gradient-to-br from-secondary-container to-card p-6">
				<div className="grid size-12 place-items-center rounded-full bg-card text-secondary shadow-card">
					<Syringe aria-hidden="true" />
				</div>
				<h1 className="mt-5 font-bold text-3xl tracking-[-0.04em]">疫苗日程</h1>
				<p className="mt-2 text-muted-foreground">
					按计划记录，具体接种时间请以医生和当地免疫计划为准。
				</p>
			</header>

			<section className="space-y-3">
				{vaccines.map((vaccine) => (
					<article
						className="rounded-[1.75rem] bg-card p-5 shadow-card"
						key={vaccine.id}
					>
						<div className="flex items-start gap-3">
							<div
								className={`grid size-11 place-items-center rounded-full ${
									vaccine.status === "completed"
										? "bg-tertiary-container text-tertiary"
										: "bg-primary-soft text-primary"
								}`}
							>
								{vaccine.status === "completed" ? (
									<CheckCircle2 aria-hidden="true" size={20} />
								) : (
									<Clock3 aria-hidden="true" size={20} />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h2 className="font-bold text-lg">{vaccine.title}</h2>
								<p className="text-muted-foreground text-sm">
									{vaccine.dose} · {vaccine.scheduledDate}
								</p>
							</div>
							<span className="rounded-full bg-surface-low px-3 py-1 font-semibold text-muted-foreground text-xs">
								{vaccine.status === "completed" ? "已完成" : "待接种"}
							</span>
						</div>
						<div className="mt-4 flex items-center justify-between border-border/45 border-t pt-4">
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Bell aria-hidden="true" size={17} />
								接种提醒
							</div>
							<button
								aria-checked={vaccine.reminderEnabled}
								aria-label={`${vaccine.title}提醒`}
								className="relative h-7 w-12 rounded-full bg-muted transition aria-checked:bg-primary-container"
								onClick={() => toggleReminder(vaccine.id)}
								role="switch"
								type="button"
							>
								<span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform group-aria-checked:translate-x-5" />
							</button>
						</div>
						<p className="mt-3 text-muted-foreground text-xs">
							来源：{vaccine.sourceName}
						</p>
					</article>
				))}
			</section>

			<aside className="flex gap-3 rounded-3xl bg-surface-low p-4 text-muted-foreground text-sm leading-6">
				<ShieldCheck className="mt-0.5 shrink-0 text-tertiary" size={20} />
				<p>仅作日程记录与科普参考，请以医生和当地免疫计划为准。</p>
			</aside>
		</div>
	);
}
