import { useEffect, useState } from "react";

import { PORTFOLIO_PROJECTS } from "@/data/portfolio-projects";
import {
	loadSyncedPortfolio,
	mergePortfolioProjects,
} from "@/data/portfolio-sync";

export function usePortfolioProjects() {
	const [projects, setProjects] = useState(PORTFOLIO_PROJECTS);
	const [syncedAt, setSyncedAt] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		loadSyncedPortfolio(controller.signal)
			.then((envelope) => {
				setProjects(
					mergePortfolioProjects(PORTFOLIO_PROJECTS, envelope.projects),
				);
				setSyncedAt(envelope.generatedAt);
			})
			.catch(() => {
				// Keep the reviewed static index when sync is unavailable.
			});
		return () => controller.abort();
	}, []);

	return { projects, syncedAt };
}
