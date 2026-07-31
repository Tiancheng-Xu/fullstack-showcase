import { createFileRoute } from "@tanstack/react-router";

import { MomentDetailContent } from "@/features/nurture/moment-detail-content";

export const Route = createFileRoute("/moments_/$momentId")({
	component: MomentDetailPage,
});

function MomentDetailPage() {
	const { momentId } = Route.useParams();
	return <MomentDetailContent momentId={momentId} />;
}
