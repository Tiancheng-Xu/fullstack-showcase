import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { COMMERCIAL_PROJECTS, COMMERCIAL_REVIEWED_AT, commercialEvidencePath, type CommercialProject } from "@/data/commercial-exploration";
import { PortfolioPageShell } from "./portfolio-page-shell";

const LINK_CLASS = "inline-flex min-h-11 items-center gap-2 border border-[#9f102a]/45 bg-white/48 px-3 py-2 font-semibold text-[#8c1428] text-xs focus-visible:outline-2 focus-visible:outline-offset-4";

export function CommercialExplorationSection() {
	return (
		<section aria-labelledby="commercial-exploration-title" className="mt-10 scroll-mt-24 md:mt-14" id="commercial-exploration" style={{ order: 4 }}>
			<header className="portfolio-section-title border-[#d8cfbd] border-b pb-3">
				<h2 className="flex items-center gap-3 font-bold font-serif text-2xl" id="commercial-exploration-title"><BriefcaseBusiness aria-hidden="true" size={20} />商业探索</h2>
				<p className="mt-2 max-w-3xl text-[#4d5863] text-sm leading-relaxed">围绕询价、核价、交期与产品资料交接的四项产品，分别说明业务价值、本人实现、上游复用和当前交付范围。</p>
			</header>
			<div className="mt-6 grid gap-6 md:grid-cols-2">
				{COMMERCIAL_PROJECTS.map((project) => (
					<article className="portfolio-commercial-card portfolio-dashboard-module-card portfolio-glass-panel min-w-0 border border-[#cfd5db] bg-white/84 p-5 md:p-6" data-commercial-project={project.id} key={project.id}>
						<h3 className="font-bold font-serif text-xl">{project.title}</h3>
						<p className="mt-3 text-[#344252] text-sm leading-7">{project.problem}</p>
						<h4 className="mt-4 font-semibold text-sm">本人实现</h4>
						<ul className="mt-2 list-disc space-y-1 pl-5 text-[#344252] text-sm leading-7">{project.contributions.map((point) => <li key={point}>{point}</li>)}</ul>
						<p className="mt-3 text-[#53656b] text-xs leading-6"><strong>上游复用：</strong>{project.reuse}</p>
						<p className="mt-4 border-t border-[#d8cfbd] pt-3 text-[#071d34] text-sm leading-7"><strong>当前范围：</strong>{project.stage}</p>
						<nav aria-label={`${project.title} 公开入口`} className="mt-4 flex flex-wrap gap-2">
							{project.productUrl ? <a className={LINK_CLASS} href={project.productUrl}>产品入口<ArrowUpRight aria-hidden="true" size={14} /></a> : null}
							<a className={LINK_CLASS} href={commercialEvidencePath(project)}>工作证明<ArrowUpRight aria-hidden="true" size={14} /></a>
						</nav>
					</article>
				))}
			</div>
			<p className="mt-4 text-[#53656b] text-xs leading-6">真实客户效果与付款仍待验证；测试与交付范围见各项目工作证明。公开范围更新：{COMMERCIAL_REVIEWED_AT}。</p>
		</section>
	);
}

export function CommercialProjectEvidence({ project }: { project: CommercialProject }) {
	const evidencePath = commercialEvidencePath(project);
	return (
		<PortfolioPageShell current="evidence" description={project.problem} evidenceUrl={`https://baby2b.online${evidencePath}`} eyebrow="Commercial Project Evidence" projectHomeUrl={project.productUrl} title={project.title}>
			<nav aria-label="商业项目证据导航" className="flex flex-wrap gap-3 text-sm">
				<a className={LINK_CLASS} href="/dashboard#commercial-exploration">作品集首页</a>
				{project.productUrl ? <a className={LINK_CLASS} href={project.productUrl}>项目主页</a> : <span className="inline-flex min-h-11 items-center text-[#53656b]">产品入口：尚未部署验收</span>}
				<a aria-current="page" className={LINK_CLASS} href="#business-evidence">工作证明</a>
			</nav>
			<section className="portfolio-glass-panel border border-[#cfd5db] bg-white/84 p-5 md:p-7" id="business-evidence">
				<h2 className="font-bold font-serif text-2xl">当前交付与证据范围</h2>
				<p className="mt-4 font-semibold text-sm leading-7">{project.stage}</p>
				<p className="mt-3 text-[#344252] text-sm leading-7">{project.verification}</p>
				<p className="mt-3 text-[#53656b] text-xs leading-6">以上依据对应实现交付与验收回执整理；本页是公开工作证明，不是该产品的业务运行服务。不同批次、替身测试与实际运行分别记账。</p>
				{project.runtimeEvidenceUrl ? <a className={`${LINK_CLASS} mt-4`} href={project.runtimeEvidenceUrl}>查看产品运行证据<ArrowUpRight aria-hidden="true" size={14} /></a> : null}
			</section>
			<section className="portfolio-glass-panel border border-[#cfd5db] bg-white/84 p-5 md:p-7">
				<h2 className="font-bold font-serif text-2xl">业务链路与实现职责</h2>
				<p className="mt-4 break-words text-sm leading-8">{project.flow}</p>
				<ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7">{project.contributions.map((point) => <li key={point}>{point}</li>)}</ul>
				<p className="mt-4 text-[#53656b] text-sm leading-7"><strong>复用与边界：</strong>{project.reuse}</p>
			</section>
			<section className="portfolio-glass-panel border border-[#cfd5db] bg-white/84 p-5 md:p-7">
				<h2 className="font-bold font-serif text-2xl">失败恢复与后续验收</h2>
				<p className="mt-4 text-sm leading-8">{project.failureBoundary}</p>
				<p className="mt-3 text-sm leading-8">真实客户效果与付款待验证；没有公开产品入口的项目，不以本页上线代替其业务部署验收。</p>
				<a className={`${LINK_CLASS} mt-4`} href="https://github.com/Tiancheng-Xu#商业探索">GitHub Profile 商业探索</a>
			</section>
		</PortfolioPageShell>
	);
}
