import { ArrowRight, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Diagram = {
	id: "architecture" | "sequence";
	title: string;
	summary: string;
	nodes: Array<{ label: string; detail: string }>;
};

const DIAGRAMS: Diagram[] = [
	{
		id: "architecture",
		title: "共享验证架构图",
		summary: "最小权限控制面只读取公开交付事实，不复制任何项目的业务运行时。",
		nodes: [
			{ label: "固定项目清单", detail: "仓库 ID、main、Production 与 Evidence 合同" },
			{ label: "GitHub OIDC", detail: "短期身份、不可变来源、无长期 AWS Key" },
			{ label: "Budget Gate", detail: "先核对实际用量、预算与 Free plan 边界" },
			{ label: "Verifier Lambda", detail: "单个非 VPC Lambda，限制超时、响应体与重试" },
			{ label: "语义检查", detail: "HTTP、最终 URL、页面标记与公开 commit 边界" },
			{ label: "脱敏 Artifact", detail: "每项目独立 JSON，7 日保存，可追溯 Run/head" },
		],
	},
	{
		id: "sequence",
		title: "串行验证时序图",
		summary: "一次 Run 依次通过身份、预算、语义和结果分级；硬 Gate 失败立即停止。",
		nodes: [
			{ label: "N1 · 固定来源", detail: "锁定 workflow ref、repository ID、main 与 head SHA" },
			{ label: "N2 · 成本门禁", detail: "读取 Budget；不满足免费计划规则则 fail-closed" },
			{ label: "N3 · 短期授权", detail: "OIDC AssumeRole，只获得调用固定 Lambda 的权限" },
			{ label: "N4 · 逐项验证", detail: "按固定清单串行读取公开 Production 与 Evidence" },
			{ label: "N5 · 诚实分级", detail: "verified 或 verified-with-limitations，不伪造私有 SHA" },
			{ label: "N6 · 保存证据", detail: "上传脱敏 Artifact，汇总 Job 核对 6/6 结果" },
		],
	},
];

function DiagramBody({ diagram, expanded = false }: { diagram: Diagram; expanded?: boolean }) {
	return (
		<div className={expanded ? "w-[min(92vw,90rem)]" : "w-full"}>
			<p className="text-[#344252] text-sm leading-relaxed">{diagram.summary}</p>
			<div className="mt-4 grid gap-3 md:grid-cols-3">
				{diagram.nodes.map((node, index) => (
					<div className="relative border border-[#c8bda9] bg-[#fbf8ef] p-4" key={node.label}>
						<p className="font-bold text-[#071d34] text-sm">{node.label}</p>
						<p className="mt-2 text-[#59636d] text-xs leading-relaxed">{node.detail}</p>
						{index < diagram.nodes.length - 1 ? (
							<ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 bg-white text-[#bf1737] md:block" size={22} />
						) : null}
					</div>
				))}
			</div>
		</div>
	);
}

export function SharedEvidenceVerifierDiagrams() {
	const [preview, setPreview] = useState<Diagram | null>(null);
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!preview) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setPreview(null);
		};
		window.addEventListener("keydown", onKeyDown);
		closeRef.current?.focus();
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [preview]);

	return (
		<section className="space-y-4" aria-label="Shared Evidence Verifier 图解">
			{DIAGRAMS.map((diagram) => (
				<article className="border border-[#c7ced8] bg-white p-5" key={diagram.id}>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="font-bold text-[#bf1737] text-xs tracking-[0.14em]">VERIFIED CLOUD EVIDENCE</p>
							<h2 className="mt-2 font-bold font-serif text-xl">{diagram.title}</h2>
						</div>
						<button className="inline-flex min-h-11 items-center gap-2 border border-[#071d34] px-3 text-[#071d34] text-xs" onClick={() => setPreview(diagram)} type="button">
							<Maximize2 aria-hidden="true" size={16} />全屏预览
						</button>
					</div>
					<div className="mt-4"><DiagramBody diagram={diagram} /></div>
				</article>
			))}

			{preview ? (
				<div aria-label={preview.title} aria-modal="true" className="fixed inset-0 z-[90] grid place-items-center overflow-auto bg-[#071d34]/95 p-4 md:p-8" role="dialog">
					<button aria-label="点击遮罩关闭预览" className="absolute inset-0 size-full cursor-zoom-out" onClick={() => setPreview(null)} type="button" />
					<div className="relative z-10 bg-white p-5 md:p-8">
						<button aria-label="关闭全屏预览" className="ml-auto grid size-11 place-items-center border border-[#071d34] text-[#071d34]" onClick={() => setPreview(null)} ref={closeRef} type="button"><X aria-hidden="true" size={21} /></button>
						<h2 className="mt-3 font-bold font-serif text-2xl text-[#071d34]">{preview.title}</h2>
						<div className="mt-5"><DiagramBody diagram={preview} expanded /></div>
					</div>
				</div>
			) : null}
		</section>
	);
}
