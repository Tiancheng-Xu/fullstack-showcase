import { useId, useRef, useState } from "react";

const WORKFLOW_IMAGE = "/portfolio/learning/customer-support-workflow-20261018.png";

export function LearningWorkflowFigure() {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [zoomed, setZoomed] = useState(false);
	const titleId = useId();

	return (
		<figure className="mt-4 max-w-xs" data-learning-workflow="true">
			<figcaption className="mb-2">
				<h4 className="font-semibold font-serif text-[#071d34] text-base">智能客服工作流</h4>
				<p className="mt-1 text-[#53656b] text-xs">点击小图放大</p>
			</figcaption>
			<a
				aria-haspopup="dialog"
				aria-label="放大智能客服工作流图"
				className="portfolio-glass-control block overflow-hidden rounded-lg border border-[#c8c0b0] bg-[#fbf8f0] p-1.5 focus-visible:outline-2 focus-visible:outline-[#b21f35] focus-visible:outline-offset-4"
				href={WORKFLOW_IMAGE}
				onClick={(event) => {
					if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
					const dialog = dialogRef.current;
					if (dialog && typeof dialog.showModal === "function") {
						event.preventDefault();
						if (!dialog.open) dialog.showModal();
					}
				}}
				rel="noreferrer"
				target="_blank"
			>
				<img alt="智能客服工作流缩略图：检索、路由、回答校验与人工兜底" className="h-auto w-full" decoding="async" height={992} loading="lazy" src={WORKFLOW_IMAGE} width={1586} />
			</a>
			<dialog
				aria-labelledby={titleId}
				className="fixed inset-0 m-auto max-h-[90dvh] w-[94vw] max-w-[1100px] overflow-y-auto rounded-xl border border-[#c8c0b0] bg-[#fbf8f0] p-4 text-[#071d34] shadow-2xl backdrop:bg-[#071d34]/70 backdrop:backdrop-blur-sm"
				onClick={(event) => {
					if (event.target !== event.currentTarget) return;
					const bounds = event.currentTarget.getBoundingClientRect();
					if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
				}}
				onClose={() => setZoomed(false)}
				ref={dialogRef}
			>
				<div className="flex items-center justify-between gap-3">
					<h4 className="font-semibold font-serif text-lg" id={titleId}>智能客服工作流</h4>
					<button aria-label="关闭工作流大图" className="portfolio-glass-control min-h-11 shrink-0 rounded-md border border-[#c8c0b0] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => dialogRef.current?.close()} type="button">关闭</button>
				</div>
				<button aria-pressed={zoomed} className="portfolio-glass-control mt-3 min-h-11 rounded-md border border-[#c8c0b0] px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => setZoomed((value) => !value)} type="button">{zoomed ? "适应窗口" : "放大细节"}</button>
				<div aria-label="工作流图片，可滚动查看细节" className="mt-3 max-h-[70dvh] overflow-auto" role="region" tabIndex={0}>
					<img alt="智能客服工作流完整图：向量化与混合检索后，按有据回答、澄清或转人工分流，校验并记录最终答复" className="h-auto w-full object-contain" decoding="async" height={992} loading="lazy" src={WORKFLOW_IMAGE} style={{ width: zoomed ? 1586 : "100%", maxWidth: zoomed ? "none" : "100%", maxHeight: zoomed ? "none" : "70dvh" }} width={1586} />
				</div>
				<p className="mt-3 text-[#53656b] text-xs leading-6">检索、路由、回答校验与人工交接。支持 Esc 关闭。<a className="ml-2 inline-flex min-h-11 items-center underline underline-offset-4" href={WORKFLOW_IMAGE} rel="noreferrer" target="_blank">查看原尺寸图片</a></p>
			</dialog>
		</figure>
	);
}
