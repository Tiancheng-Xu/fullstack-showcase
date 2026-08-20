import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { PORTFOLIO_PROJECTS } from "./src/data/portfolio-projects";

const staticPortfolioIndex = {
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	projectCount: PORTFOLIO_PROJECTS.length,
	projects: PORTFOLIO_PROJECTS,
};

const portfolioIndexPlugin: Plugin = {
	name: "portfolio-project-index",
	generateBundle() {
		this.emitFile({
			type: "asset" as const,
			fileName: "portfolio-projects.json",
			source: `${JSON.stringify(staticPortfolioIndex, null, 2)}\n`,
		});
	},
};

export default defineConfig({
	server: {
		port: 3001,
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		portfolioIndexPlugin,
	],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
});
