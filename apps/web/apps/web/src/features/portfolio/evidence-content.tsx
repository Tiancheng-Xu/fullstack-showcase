import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle2,
	CircleCheckBig,
	Clock3,
	Maximize2,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
	getMigratedEvidence,
	type MigratedEvidenceAsset,
	type MigratedEvidenceDocument,
} from "@/data/migrated-evidence";
import { PROJECTS_INDEX } from "@/data/portfolio-projects";
import {
	performanceApplicationIdForControlProject,
	performanceControlPath,
} from "@/data/performance-applications";
import { PortfolioPageShell } from "@/features/portfolio/portfolio-page-shell";
import { PerformanceEvidenceDiagrams } from "@/features/performance/performance-evidence-diagrams";
import { resolvePerformanceView } from "@/features/performance/performance-state";
import { PerformanceStatusCard } from "@/features/performance/performance-status-card";
import { SharedEvidenceVerifierDiagrams } from "./shared-evidence-verifier-diagrams";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@web/ui/components/card";

export function EvidenceContent({ projectId }: { projectId: string }) {
	const project = PROJECTS_INDEX[projectId];

	if (!project) {
		return (
			<div className="space-y-4">
				<header>
					<h1 className="font-bold text-2xl">项目不存在</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						该卡片已失效或未在看板中配置，建议返回看板后重试。
					</p>
				</header>
				<Link
					className="inline-flex min-h-11 items-center gap-2 text-primary text-sm"
					to="/dashboard"
				>
					<ArrowLeft aria-hidden="true" size={16} />
					返回看板
				</Link>
			</div>
		);
	}
	const projectHomeUrl =
		project.ownerPage ??
		(project.performance
			? performanceControlPath(
					performanceApplicationIdForControlProject(project.id),
				)
			: "/dashboard#projects");
	const evidenceUrl =
		project.evidenceUrl ?? `https://baby2b.online/evidence/${project.id}`;
	const migratedEvidence = getMigratedEvidence(project.id);

	return (
		<PortfolioPageShell
			current="evidence"
			description={project.desc}
			evidenceUrl={evidenceUrl}
			eyebrow="Project Evidence"
			projectHomeUrl={projectHomeUrl}
			title={project.title}
		>
			<Card className="portfolio-glass-panel rounded-none border-[#c7ced8] bg-white/90 shadow-sm">
				<CardHeader>
					<CardTitle className="text-xl">{project.title}</CardTitle>
					<CardDescription>{project.desc}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{project.performance ? (
						<PerformanceStatusCard
							projectId={project.id}
							projectName={project.title}
							status={resolvePerformanceView(project.performance)}
						/>
					) : null}
					{project.caseStudy ? (
						<div className="border border-amber-300 bg-amber-50 p-4 text-amber-950 text-sm leading-relaxed">
							<strong>当前证据状态：</strong> {project.caseStudy.stateNotice}
						</div>
					) : null}
					{migratedEvidence ? (
						<MigratedEvidenceSections
							document={migratedEvidence}
							projectId={project.id}
						/>
					) : null}
					<p className="text-sm leading-relaxed text-muted-foreground">
						以下为该项目完整工作证明内容，支持回跳看板并访问对应 evidence 页面。
					</p>
					<div className="flex flex-wrap gap-2 text-xs">
						<span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1">
							{project.status === "已完成" ? (
								<CheckCircle2 aria-hidden="true" size={14} />
							) : (
								<Clock3 aria-hidden="true" size={14} />
							)}
							{project.status}
						</span>
						<span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1">
							进度 {project.progress}%
						</span>
					</div>
					<div className="space-y-1">
						<h2 className="font-medium text-foreground">项目架构</h2>
						<p className="leading-relaxed text-muted-foreground text-sm">
							{project.architecture}
						</p>
					</div>
					<div className="space-y-2">
						<h2 className="font-medium text-foreground">Evidence 结构</h2>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{project.evidence.map((item) => (
								<li className="flex items-start gap-2" key={item}>
									<CircleCheckBig
										aria-hidden="true"
										className="mt-0.5 flex-none text-primary"
										size={16}
									/>
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
					{project.caseStudy ? (
						<>
							{project.id === "performance-observability-control" ? (
								<PerformanceEvidenceDiagrams />
							) : null}
							{project.id === "shared-evidence-verifier" ? (
								<SharedEvidenceVerifierDiagrams />
							) : null}
							<section className="space-y-3">
								<h2 className="font-semibold text-lg">交付要求到证据映射</h2>
								<div className="overflow-x-auto">
									<table className="w-full min-w-[760px] border-collapse text-left text-sm">
										<thead>
											<tr className="bg-muted/60">
												{["交付要求", "实现功能", "代码位置", "验证证据", "状态"].map((heading) => (
													<th className="border border-border p-3" key={heading}>{heading}</th>
												))}
											</tr>
										</thead>
										<tbody>
											{project.caseStudy.requirements.map((item) => (
												<tr key={item.requirement}>
													<td className="border border-border p-3 align-top">{item.requirement}</td>
													<td className="border border-border p-3 align-top">{item.implementation}</td>
													<td className="border border-border p-3 align-top font-mono text-xs">{item.code}</td>
													<td className="border border-border p-3 align-top">{item.proof}</td>
													<td className="border border-border p-3 align-top font-medium">{item.state}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>

							{project.caseStudy.sections.map((section) => (
								<section className="space-y-3 border border-border/70 bg-muted/20 p-4" key={section.title}>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<h2 className="font-semibold text-lg">{section.title}</h2>
										<span className="w-fit rounded-full border border-border bg-background px-2.5 py-1 font-medium text-xs">{section.state}</span>
									</div>
									<p className="text-muted-foreground text-sm leading-relaxed">{section.summary}</p>
									<ol className="space-y-2 text-sm text-muted-foreground">
										{section.steps.map((step, index) => (
											<li className="flex items-start gap-3" key={step}>
												<span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground text-xs">{index + 1}</span>
												<span className="pt-0.5 leading-relaxed">{step}</span>
											</li>
										))}
									</ol>
								</section>
							))}
						</>
					) : null}
					<div className="space-y-2">
						<h2 className="font-medium text-foreground">项目说明</h2>
						<ul className="space-y-2 text-sm text-muted-foreground">
							{project.details.map((item) => (
								<li className="list-inside list-disc" key={item}>
									{item}
								</li>
							))}
						</ul>
					</div>
					<footer className="flex flex-wrap items-center gap-3 border-border border-t pt-5">
						<Link className="inline-flex min-h-11 items-center gap-2 border border-border px-4 py-2 text-sm" to="/dashboard">
							<ArrowLeft aria-hidden="true" size={15} />
							作品集首页
						</Link>
						<a
							className="inline-flex min-h-11 items-center border border-border px-4 py-2 text-sm"
							href={projectHomeUrl}
						>
							项目主页
						</a>
						<a
							aria-current="page"
							className="inline-flex min-h-11 items-center bg-primary px-4 py-2 text-primary-foreground text-sm"
							href={evidenceUrl}
						>
							工作证明
						</a>
					</footer>
				</CardContent>
			</Card>
		</PortfolioPageShell>
	);
}

function MigratedEvidenceSections({
	document,
	projectId,
}: {
	document: MigratedEvidenceDocument;
	projectId: string;
}) {
	const [preview, setPreview] = useState<MigratedEvidenceAsset | null>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!preview) return;
		const previousFocus = globalThis.document.activeElement as HTMLElement | null;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setPreview(null);
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = Array.from(
				dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
			);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable.at(-1);
			if (event.shiftKey && globalThis.document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && globalThis.document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		closeButtonRef.current?.focus();
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			previousFocus?.focus();
		};
	}, [preview]);

	return (
		<div className="space-y-8 border-[#d8cfbd] border-t pt-8">
			<section className="border border-[#d8cfbd] bg-[#fbf8ef] p-5 md:p-6">
				<p className="font-bold text-[#bf1737] text-xs uppercase tracking-[0.16em]">
					{document.kicker}
				</p>
				<h2 className="mt-3 font-bold font-serif text-2xl">迁移后的完整工作证明</h2>
				<p className="mt-3 font-bold text-sm">{document.status}</p>
				<p className="mt-1 text-[#59636d] text-sm">{document.subtitle}</p>
				<p className="mt-4 text-[#344252] text-sm leading-relaxed">
					{document.summary}
				</p>
				<div className="mt-4 grid gap-3 border-[#d8cfbd] border-t pt-4 md:grid-cols-2">
					<p className="text-sm leading-relaxed"><strong>版本 / 模型：</strong>{document.model}</p>
					<p className="text-sm leading-relaxed"><strong>范围：</strong>{document.scope}</p>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					{document.promotionItems.map((item) => <span className="border border-[#c8bda9] bg-white px-3 py-2 text-xs" key={item.label}><strong>{item.label}：</strong>{item.value}</span>)}
				</div>
			</section>

			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{document.metricCards.map((metric) => (
					<article className="border border-[#d8cfbd] bg-white p-4" key={metric.label}>
						<p className="font-bold text-[#59636d] text-xs tracking-[0.12em]">{metric.label}</p>
						<p className="mt-2 font-bold font-serif text-2xl text-[#bf1737]">{metric.value}</p>
						<p className="mt-1 font-bold text-xs">{metric.detail}</p>
						<p className="mt-3 text-[#344252] text-xs leading-relaxed">{metric.meaning}</p>
					</article>
				))}
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">原始指标与术语</h2>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{Object.entries(document.metrics).map(([key, value]) => <div className="border border-[#d8cfbd] bg-white p-4" key={key}><p className="font-mono text-[#59636d] text-xs">{key}</p><p className="mt-2 font-bold text-lg">{String(value)}</p></div>)}
				</div>
				<div className="grid gap-3 md:grid-cols-2">
					{document.story.terms.map((term) => <article className="border border-[#e1d8c7] bg-[#f8f3e8] p-4" key={term.name}><h3 className="font-bold">{term.name}</h3><p className="mt-2 text-sm leading-relaxed">{term.meaning}</p></article>)}
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">实施步骤与设计取舍</h2>
				{document.meaningfulSteps.map((step) => <article className="border border-[#c7ced8] bg-white p-5" key={step.title}><h3 className="font-bold font-serif text-xl">{step.title}</h3><div className="mt-4 grid gap-3 text-sm leading-relaxed md:grid-cols-2"><p><strong>目的：</strong>{step.purpose}</p><p><strong>设计原因：</strong>{step.designReason}</p><p><strong>范围：</strong>{step.scope}</p><p><strong>预期：</strong>{step.expected}</p><p><strong>风险：</strong>{step.risks}</p><p><strong>观察：</strong>{step.observed}</p><p className="md:col-span-2"><strong>证据：</strong>{step.proof}</p></div></article>)}
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">目标与交付结果</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<p className="border border-[#d8cfbd] bg-[#f8f3e8] p-4 text-sm leading-relaxed"><strong>目标：</strong>{document.story.goal}</p>
					<p className="border border-[#d8cfbd] bg-[#f8f3e8] p-4 text-sm leading-relaxed"><strong>结果：</strong>{document.story.result}</p>
				</div>
				<ol className="grid gap-3 md:grid-cols-2">
					{document.story.steps.map((step, index) => (
						<li className="flex gap-3 border border-[#e1d8c7] bg-white p-4 text-sm leading-relaxed" key={step}>
							<span className="grid size-7 shrink-0 place-items-center bg-[#071d34] font-bold text-white text-xs">{index + 1}</span>
							<span>{step}</span>
						</li>
					))}
				</ol>
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">架构实现状态</h2>
				<div className="grid gap-3 md:grid-cols-2">
					{Object.entries(document.architecture).map(([key, item]) => <article className="border border-[#d8cfbd] bg-[#f8f3e8] p-4" key={key}><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{key}</h3><span className="border border-[#c8bda9] px-2 py-1 text-[10px] uppercase">{item.status}</span></div>{item.description ? <p className="mt-3 text-sm leading-relaxed">{item.description}</p> : null}{item.note ? <p className="mt-3 text-sm leading-relaxed">{item.note}</p> : null}{item.source ? <p className="mt-3 font-mono text-[#59636d] text-xs">{item.source}</p> : null}</article>)}
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">架构与关键节点</h2>
				{document.diagrams.map((diagram) => (
					<article className="border border-[#c7ced8] bg-white p-5" key={diagram.id}>
						<p className="font-bold text-[#bf1737] text-xs tracking-[0.14em]">{diagram.eyebrow}</p>
						<h3 className="mt-2 font-bold font-serif text-xl">{diagram.title}</h3>
						<p className="mt-2 font-bold text-sm">{diagram.plain}</p>
						<p className="mt-2 text-[#344252] text-sm leading-relaxed">{diagram.summary}</p>
						<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
							{diagram.nodes.map((node) => (
								<div className="border border-[#d8cfbd] bg-[#f8f3e8] p-4" key={node.id}>
									<div className="flex items-start justify-between gap-3">
										<h4 className="font-bold">{node.id} · {node.label}</h4>
										<span className="border border-[#c8bda9] px-2 py-1 text-[10px] uppercase">{node.status}</span>
									</div>
									<p className="mt-2 text-sm leading-relaxed">{node.detail}</p>
									{node.purpose ? <p className="mt-2 text-[#59636d] text-xs leading-relaxed"><strong>作用：</strong>{node.purpose}</p> : null}
									{node.pass ? <p className="mt-2 text-[#59636d] text-xs leading-relaxed"><strong>通过：</strong>{node.pass}</p> : null}
									{node.block ? <p className="mt-2 text-[#59636d] text-xs leading-relaxed"><strong>阻断：</strong>{node.block}</p> : null}
								</div>
							))}
						</div>
					</article>
				))}
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">Proof 矩阵</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{document.proof.map((proof) => <article className="border border-[#d8cfbd] bg-white p-4" key={proof.id}><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{proof.id} · {proof.title}</h3><span className="border border-[#c8bda9] px-2 py-1 text-[10px] uppercase">{proof.status}</span></div><p className="mt-3 text-sm leading-relaxed">{proof.description}</p><p className="mt-2 text-sm leading-relaxed"><strong>检查：</strong>{proof.lookFor}</p><p className="mt-2 text-sm leading-relaxed"><strong>证明：</strong>{proof.proves}</p>{proof.asset ? <p className="mt-2 font-mono text-[#59636d] text-xs">{proof.asset}</p> : null}</article>)}
				</div>
				{Object.keys(document.experiments).length > 0 ? <details className="border border-[#d8cfbd] bg-[#f8f3e8] p-4"><summary className="cursor-pointer font-bold">实验与运行记录</summary><pre className="mt-4 whitespace-pre-wrap break-words text-xs leading-relaxed">{JSON.stringify(document.experiments, null, 2)}</pre></details> : null}
				<p className="break-all border border-[#d8cfbd] bg-white p-4 font-mono text-xs">{document.integrityLabel}: {Object.entries(document.integrity).map(([key, value]) => `${key}=${value}`).join(" · ")}</p>
			</section>

			<section className="space-y-4">
				<div>
					<h2 className="font-bold font-serif text-2xl">证据图与完整性</h2>
					<p className="mt-2 text-[#59636d] text-sm">单击图片可站内全屏预览；摘要来自冻结的源清单。</p>
				</div>
				<div className="grid gap-5 lg:grid-cols-2">
					{document.assets.map((asset) => {
						const source = `/evidence/${projectId}/assets/${asset.file}`;
						return (
							<figure className="border border-[#c7ced8] bg-white p-3" key={asset.id}>
								<button className="group relative block w-full cursor-zoom-in overflow-hidden border border-[#d8cfbd] bg-[#f8f3e8]" onClick={() => setPreview(asset)} type="button">
									<img alt={asset.alt} className="h-auto max-h-[34rem] w-full object-contain transition group-hover:scale-[1.01]" loading="lazy" src={source} />
									<span className="absolute right-3 bottom-3 inline-flex min-h-11 items-center gap-2 bg-[#071d34] px-3 text-white text-xs"><Maximize2 aria-hidden="true" size={16} />全屏预览</span>
								</button>
								<figcaption className="px-1 pt-3">
									<p className="font-bold text-sm">{asset.title}</p>
									<p className="mt-1 break-all font-mono text-[#59636d] text-[10px]">SHA-256 {asset.sha256} · {asset.bytes.toLocaleString()} bytes</p>
								</figcaption>
							</figure>
						);
					})}
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="font-bold font-serif text-2xl">关键难点与修复闭环</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{document.incidents.map((incident) => (
						<article className="border border-[#d8cfbd] bg-[#fbf8ef] p-4" key={incident.id}>
							<h3 className="font-bold">{incident.id} · {incident.title}</h3>
							<p className="mt-2 font-bold text-sm">{incident.plain}</p>
							<p className="mt-3 text-sm leading-relaxed"><strong>症状：</strong>{incident.symptom}</p>
							<p className="mt-2 text-sm leading-relaxed"><strong>根因：</strong>{incident.cause}</p>
							<p className="mt-2 text-sm leading-relaxed"><strong>修复：</strong>{incident.fix}</p>
							<p className="mt-2 text-sm leading-relaxed"><strong>复核：</strong>{incident.recheck}</p>
						</article>
					))}
				</div>
			</section>

			<section className="border border-amber-300 bg-amber-50 p-5">
				<h2 className="font-bold font-serif text-xl text-amber-950">限制与未验证边界</h2>
				<ul className="mt-3 space-y-2 text-amber-950 text-sm leading-relaxed">
					{document.limitations.map((limitation) => <li className="list-inside list-disc" key={limitation}>{limitation}</li>)}
				</ul>
				<p className="mt-4 break-all border-amber-300 border-t pt-4 font-mono text-[10px] text-amber-900">
					来源 {document.provenance.sourceRepository}@{document.provenance.sourceCommit} · manifest SHA-256 {document.provenance.sourceManifestSha256}
				</p>
			</section>

			{preview ? (
				<div aria-label={preview.title} aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center bg-[#071d34]/94 p-3 md:p-8" ref={dialogRef} role="dialog">
					<button aria-label="关闭全屏预览" className="absolute inset-0 size-full cursor-zoom-out" onClick={() => setPreview(null)} type="button" />
					<div className="relative z-10 flex max-h-full max-w-[96vw] flex-col gap-3">
						<button aria-label="关闭全屏预览" className="ml-auto grid size-11 place-items-center border border-white/40 bg-white text-[#071d34]" onClick={() => setPreview(null)} ref={closeButtonRef} type="button"><X aria-hidden="true" size={21} /></button>
						<img alt={preview.alt} className="max-h-[calc(100vh-7rem)] max-w-[94vw] object-contain" src={`/evidence/${projectId}/assets/${preview.file}`} />
					</div>
				</div>
			) : null}
		</div>
	);
}
