import { Activity, ExternalLink, Gauge, History, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
	performanceApplicationIdForControlProject,
	performanceControlPath,
} from "@/data/performance-applications";
import {
	resolvePerformanceView,
	validatePerformanceSnapshot,
} from "./performance-state";
import type {
	PerformanceMetric,
	PerformanceSnapshot,
	PerformanceView,
} from "./performance-types";

export function PerformanceStatusCard({ controlHref, projectId, projectName, status }: { controlHref?: string; projectId?: string; projectName: string; status: PerformanceView }) {
	const [view, setView] = useState(status);
	useEffect(() => {
		setView(status);
		if (!projectId) return;
		let active = true;
		const load = async () => {
			try {
				const query = `?project=${encodeURIComponent(projectId)}`;
				const snapshotResult = await fetch(`/api/performance/snapshot${query}`, {
					headers: { accept: "application/json" },
				});
				let snapshot = status.snapshot;
				if (snapshotResult.ok) {
					const candidate = (await snapshotResult.json()) as PerformanceSnapshot;
					if (candidate.schemaVersion === 2 || candidate.schemaVersion === "performance-snapshot/v1") {
						const validated = validatePerformanceSnapshot(candidate);
						if (validated.ok) snapshot = validated.snapshot;
					}
				}
				if (active) {
					setView(resolvePerformanceView({ controlState: status.controlState, liveHealthy: status.controlState === "running", latestSnapshot: snapshot }));
				}
			} catch {
				// Keep the SSR/static trusted state; never fabricate a replacement.
			}
		};
		void load();
		return () => {
			active = false;
		};
	}, [projectId, status]);
	const resolvedControlHref =
		controlHref ??
		performanceControlPath(
			performanceApplicationIdForControlProject(projectId ?? "babysteps"),
		);

	const metrics = view.snapshot?.metrics ?? [];
	const isHistorical = view.dataMode === "historical";
	const totalSamples = metrics.reduce((sum, metric) => sum + metric.sampleCount, 0);
	const totalErrors = metrics.reduce((sum, metric) => sum + metric.errorCount, 0);
	return (
		<article className="border border-[#c7ced8] bg-white/90 p-5 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="grid size-11 shrink-0 place-items-center bg-[#e4ece9] text-[#0f2d4d]">{isHistorical ? <History aria-hidden="true" size={20} /> : <Activity aria-hidden="true" size={20} />}</div>
					<div><p className="font-bold text-xs uppercase tracking-[0.12em] text-[#5a6470]">性能观测 · {projectName}</p><h3 className="mt-1 font-serif font-bold text-xl">{view.label}</h3><p className="mt-2 max-w-2xl text-[#344252] text-sm leading-relaxed">{view.detail}</p></div>
				</div>
				<span className="inline-flex min-h-11 items-center gap-2 border border-[#d8cfbd] bg-[#f8f3e8] px-3 py-2 font-bold text-xs"><ShieldCheck aria-hidden="true" size={15} />{view.controlState}</span>
			</div>

			{metrics.length > 0 ? (
				<>
					<div className="mt-5 grid gap-3 sm:grid-cols-3">
						<Metric label="监测指标" value={`${metrics.length} 项`} />
						<Metric label="样本数" value={String(totalSamples)} />
						<Metric label="错误事件" value={String(totalErrors)} />
					</div>
					<div className="mt-4 grid gap-3 lg:grid-cols-2" aria-label="真实性能指标分位图">
						{metrics.map((metric) => <MetricPercentileChart key={metric.name} metric={metric} />)}
					</div>
				</>
			) : (
				<p className="mt-5 border border-dashed border-[#c7ced8] bg-[#f8f3e8] px-4 py-3 text-[#4d5863] text-sm">没有校验通过的快照时不会生成模拟性能数据；恢复观测并完成闭环后再展示真实指标。</p>
			)}

			<div className="mt-5 flex flex-col gap-3 border-[#d8cfbd] border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-[#5a6470] text-xs">数据模式：{view.dataMode} · 快照：{view.snapshot?.captureId ?? "无"}</p>
				<a className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#0f2d4d] px-4 py-3 font-bold text-sm text-white" href={resolvedControlHref}><Gauge aria-hidden="true" size={17} />进入成本控制<ExternalLink aria-hidden="true" size={14} /></a>
			</div>
		</article>
	);
}

function MetricPercentileChart({ metric }: { metric: PerformanceMetric }) {
	const max = Math.max(metric.p95, 1);
	return (
		<section className="border border-[#d8cfbd] bg-[#f8f3e8] p-4">
			<div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{metric.name}</h4><p className="text-[#5a6470] text-xs">{metric.sampleCount} 样本 · {metric.errorCount} 错误</p></div><span className="border border-[#d8cfbd] bg-white px-2 py-1 text-xs">{metric.category ?? metric.unit}</span></div>
			<div className="mt-3 grid gap-2">
				<PercentileBar label="p50" value={metric.p50} max={max} unit={metric.unit} tone="bg-[#789b83]" />
				<PercentileBar label="p75" value={metric.p75} max={max} unit={metric.unit} tone="bg-[#c29346]" />
				<PercentileBar label="p95" value={metric.p95} max={max} unit={metric.unit} tone="bg-[#bf1737]" />
			</div>
		</section>
	);
}

function PercentileBar({ label, value, max, unit, tone }: { label: string; value: number; max: number; unit: string; tone: string }) {
	return <div aria-label={`${label} ${value} ${unit}`}><div className="flex justify-between gap-2 text-xs"><span>{label}</span><strong><span>{value} {unit}</span></strong></div><div className="mt-1 h-2 overflow-hidden bg-[#d9d3c5]"><div className={`h-full ${tone}`} style={{ width: `${Math.max(3, (value / max) * 100)}%` }} /></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
	return <div className="border border-[#d8cfbd] bg-[#f8f3e8] p-3"><p className="text-[#5a6470] text-xs">{label}</p><p className="mt-1 font-bold text-lg">{value}</p></div>;
}
