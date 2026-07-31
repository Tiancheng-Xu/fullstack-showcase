import {
	ArrowLeft,
	BookOpen,
	Clock3,
	ExternalLink,
	ShieldCheck,
} from "lucide-react";

import { guideItems } from "./data";
import { guideProviders } from "./guide-providers";

export function GuideArticleContent({ articleId }: { articleId: string }) {
	const article = guideItems.find((item) => item.id === articleId);

	if (!article) {
		return (
			<section className="rounded-[2rem] bg-card p-7 text-center shadow-card">
				<h1 className="font-bold text-2xl">没有找到这篇文章</h1>
				<p className="mt-2 text-muted-foreground">它可能已更新或暂时下线。</p>
				<a
					className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary-container px-5 font-bold text-primary"
					href="/guide"
				>
					返回育儿百科
				</a>
			</section>
		);
	}

	const provider = guideProviders.find(
		(item) => item.id === article.sourceProviderId,
	);

	return (
		<article className="space-y-6">
			<a
				aria-label="返回育儿百科"
				className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow-card"
				href="/guide"
			>
				<ArrowLeft aria-hidden="true" size={20} />
			</a>

			{article.image ? (
				<img
					alt=""
					className="aspect-[16/10] w-full rounded-[2rem] object-cover shadow-card"
					src={article.image}
				/>
			) : null}

			<section className="rounded-[2rem] bg-card p-6 shadow-card">
				<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
					<span className="rounded-full bg-primary-soft px-3 py-1 font-bold text-primary text-xs">
						{article.category}
					</span>
					<span className="inline-flex items-center gap-1">
						<Clock3 aria-hidden="true" size={15} />
						{article.readingMinutes}分钟阅读
					</span>
					<span>{article.ageRange}</span>
				</div>
				<h1 className="mt-4 font-bold text-3xl tracking-[-0.04em]">
					{article.title}
				</h1>
				<p className="mt-3 text-muted-foreground leading-7">
					{article.description}
				</p>
				<div className="mt-6 space-y-4 text-foreground/85 leading-8">
					{(article.body ?? [article.description]).map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>
			</section>

			<section className="rounded-[2rem] bg-secondary-soft/55 p-6">
				<h2 className="flex items-center gap-2 font-bold">
					<BookOpen aria-hidden="true" size={18} />
					资料来源
				</h2>
				<a
					className="mt-3 inline-flex items-start gap-2 font-semibold text-secondary underline decoration-secondary/35 underline-offset-4"
					href={article.sourceUrl}
					rel="noreferrer"
					target="_blank"
				>
					{article.sourceName}
					<ExternalLink
						aria-hidden="true"
						className="mt-1 shrink-0"
						size={15}
					/>
				</a>
				<p className="mt-2 text-muted-foreground text-xs leading-5">
					{provider?.use}。资料访问于 {article.sourceAccessedAt}，内容审核于{" "}
					{article.reviewedAt}。
				</p>
			</section>

			<section className="flex gap-3 rounded-[2rem] bg-error-container p-5 text-on-error-container">
				<ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
				<div>
					<h2 className="font-bold">阅读提示</h2>
					<p className="mt-1 text-sm leading-6">{article.disclaimer}</p>
				</div>
			</section>
		</article>
	);
}
