import { createFileRoute } from "@tanstack/react-router";
import { PortfolioIndexShell } from "@/features/portfolio/portfolio-index-shell";
import { SharingIndexContent } from "@/features/portfolio/sharing-index-content";

export const Route = createFileRoute("/sharing")({ component: SharingRoute });

function SharingRoute() {
  return <PortfolioIndexShell current="sharing" kicker="NOTES & SOURCES" title="分享" description="阅读路线、引擎专题与技术会议文字资料，按来源与状态整理。"><SharingIndexContent /></PortfolioIndexShell>;
}
