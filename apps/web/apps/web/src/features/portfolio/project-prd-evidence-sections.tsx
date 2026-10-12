import {
	PRD_EVIDENCE_COVERAGE,
	type ProjectPrdEvidence,
} from "@/data/project-prd-evidence";

export function ProjectPrdEvidenceSections({
	entry,
}: {
	entry: ProjectPrdEvidence;
}) {
	const source = PRD_EVIDENCE_COVERAGE.sources.find(
		({ id }) => id === entry.sourceId,
	);

	return (
		<section
			aria-labelledby="prd-design-heading"
			className="space-y-5 border border-[#c7ced8] bg-white/90 p-5 shadow-sm md:p-7"
			id="prd-design"
		>
			<header className="space-y-2">
				<p className="font-medium text-primary text-sm">{entry.status}</p>
				<h2 className="font-semibold text-xl" id="prd-design-heading">
					PRD 定位与证据边界
				</h2>
				<p className="text-muted-foreground text-sm">
					文档与摘要复核日期：
					<time dateTime={entry.reviewedAt}>{entry.reviewedAt}</time>
				</p>
			</header>
			<div className="space-y-2">
				<h3 className="font-medium">产品定位与设计</h3>
				<p className="text-sm leading-relaxed">{entry.positioning}</p>
				<ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
					{entry.mechanisms.map((mechanism) => (
						<li key={mechanism}>{mechanism}</li>
					))}
				</ul>
			</div>
			<dl className="grid gap-4 text-sm md:grid-cols-2">
				<div className="space-y-2 border border-border p-4">
					<dt className="font-medium">历史材料与本人确认</dt>
					<dd className="text-muted-foreground leading-relaxed">
						{entry.historicalEvidence}
					</dd>
				</div>
				<div className="space-y-2 border border-amber-300 bg-amber-50 p-4 text-amber-950">
					<dt className="font-medium">当前版本与未验证边界</dt>
					<dd className="leading-relaxed">{entry.currentBoundary}</dd>
				</div>
			</dl>
			{source ? (
				<div className="space-y-2 border-t pt-4 text-muted-foreground text-sm">
					<p>来源文档：{source.name}</p>
					<p className="font-medium text-foreground">SHA-256 校验原件身份</p>
					<code className="block break-all font-mono text-xs">
						{source.sha256}
					</code>
					<p className="leading-relaxed">
						{PRD_EVIDENCE_COVERAGE.reviewScope}{" "}
						哈希用于匹配来源版本，不证明项目运行、操作者身份或本人掌握。
					</p>
					<a
						className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
						href="/evidence#prd-coverage"
					>
						查看资料覆盖与校验说明
					</a>
				</div>
			) : null}
		</section>
	);
}
