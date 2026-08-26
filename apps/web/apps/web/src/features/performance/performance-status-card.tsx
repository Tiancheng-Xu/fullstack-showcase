import { Activity, ExternalLink, Gauge, History, ShieldCheck } from "lucide-react";

import type { PerformanceView } from "./performance-types";

export function PerformanceStatusCard({
	projectId,
	projectName,
	status,
}: {
	projectId: string;
	projectName: string;
	status: PerformanceView;
}) {
	const metric = status.snapshot?.metrics[0] ?? null;
	const isHistorical = status.dataMode === "historical";
	const source = status.snapshot?.source;
	const runUrl = source
		? `https://github.com/${source.repository}/actions/runs/${source.workflowRunId}`
		: null;

	return (
		<article className="border border-[#c7ced8] bg-white/90 p-5 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-3">
					<div className="grid size-11 shrink-0 place-items-center bg-[#e4ece9] text-[#0f2d4d]">
						{isHistorical ? <History aria-hidden="true" size={20} /> : <Activity aria-hidden="true" size={20} />}
					</div>
					<div>
						<p className="font-bold text-xs uppercase tracking-[0.12em] text-[#5a6470]">
							性能观测 · {projectName}
						</p>
						<h3 className="mt-1 font-serif font-bold text-xl">{status.label}</h3>
						<p className="mt-2 max-w-2xl text-[#344252] text-sm leading-relaxed">
							{status.detail}
						</p>
					</div>
				</div>
				<span className="inline-flex min-h-11 items-center gap-2 border border-[#d8cfbd] bg-[#f8f3e8] px-3 py-2 font-bold text-xs">
					<ShieldCheck aria-hidden="true" size={15} />
					{status.controlState}
				</span>
			</div>

			{metric ? (
				<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<Metric label={`${metric.name} p50`} value={`${metric.p50} ${metric.unit}`} />
					<Metric label={`${metric.name} p75`} value={`${metric.p75} ${metric.unit}`} />
					<Metric label={`${metric.name} p95`} value={`${metric.p95} ${metric.unit}`} />
					<Metric label="样本数" value={String(metric.sampleCount)} />
				</div>
			) : (
				<p className="mt-5 border border-dashed border-[#c7ced8] bg-[#f8f3e8] px-4 py-3 text-[#4d5863] text-sm">
					没有校验通过的快照时不会生成模拟性能数据；恢复观测并完成闭环后再展示真实指标。
				</p>
			)}

			<div className="mt-5 flex flex-col gap-3 border-[#d8cfbd] border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1 text-[#5a6470] text-xs">
					<p>数据模式：{status.dataMode} · 快照：{status.snapshot?.captureId ?? "无"}</p>
					{status.snapshot ? <p>采集时间：<time dateTime={status.snapshot.capturedAt}>{status.snapshot.capturedAt}</time></p> : null}
					{runUrl && source ? (
						<a className="inline-flex min-h-11 items-center gap-2 font-bold text-[#0f2d4d] underline-offset-4 hover:underline" href={runUrl} rel="noreferrer" target="_blank">
							Run #{source.workflowRunId} · commit {source.commitSha.slice(0, 12)}
							<ExternalLink aria-hidden="true" size={13} />
						</a>
					) : null}
				</div>
				<a
					className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#0f2d4d] px-4 py-3 font-bold text-sm text-white"
					href={`/performance-control?project=${encodeURIComponent(projectId)}`}
				>
					<Gauge aria-hidden="true" size={17} />
					进入成本控制
					<ExternalLink aria-hidden="true" size={14} />
				</a>
			</div>
		</article>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="border border-[#d8cfbd] bg-[#f8f3e8] p-3">
			<p className="text-[#5a6470] text-xs">{label}</p>
			<p className="mt-1 font-bold text-lg">{value}</p>
		</div>
	);
}
