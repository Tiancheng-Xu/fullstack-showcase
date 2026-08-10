import { createFileRoute } from "@tanstack/react-router";

import { GuideArticleContent } from "@/features/nurture/guide-article-content";

export const Route = createFileRoute("/guide_/$articleId")({
	component: GuideArticlePage,
});

function GuideArticlePage() {
	const { articleId } = Route.useParams();
	return <GuideArticleContent articleId={articleId} />;
}
