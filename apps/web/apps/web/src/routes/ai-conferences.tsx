import { createFileRoute } from "@tanstack/react-router";
import { PortfolioIndexShell } from "@/features/portfolio/portfolio-index-shell";
import { AiConferenceContent } from "@/features/portfolio/sharing-index-content";

export const Route = createFileRoute("/ai-conferences")({ component: AiConferencesRoute });

function AiConferencesRoute() {
  return <PortfolioIndexShell current="sharing" kicker="OFFICIAL TEXT ARCHIVE" title="AI 前瞻会议" description="有出处、有日期、有边界的官方文字资料阅读整理。"><AiConferenceContent /></PortfolioIndexShell>;
}
