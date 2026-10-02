import { createFileRoute } from "@tanstack/react-router";
import { PortfolioIndexShell } from "@/features/portfolio/portfolio-index-shell";
import { OverreactedReadingRouteContent } from "@/features/portfolio/overreacted-reading-route-content";

export const Route = createFileRoute("/overreacted-reading-route")({ component: ReadingRoute });

function ReadingRoute() {
  return <PortfolioIndexShell current="sharing" kicker="READING ROUTE" title="Overreacted 阅读路线" description="一篇笔记，七个阶段；逐篇带读进行中。"><OverreactedReadingRouteContent /></PortfolioIndexShell>;
}
