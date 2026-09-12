import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
	resolve(process.cwd(), "src/features/portfolio/dashboard-content.tsx"),
	"utf8",
);
const navigationSource = readFileSync(
	resolve(
		process.cwd(),
		"src/features/portfolio/portfolio-primary-navigation.tsx",
	),
	"utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("dashboard navigation contract", () => {
	it("keeps the original portfolio brand and uses real page routes", () => {
		expect(source).not.toContain("UKIYO-E PORTFOLIO");
		expect(source).toContain("TIANCHENG XU · PORTFOLIO");
		expect(source).not.toContain('href="/dashboard#projects"');
		expect(navigationSource).toContain('href: "/dashboard"');
		expect(navigationSource).toContain('href: "/projects"');
		expect(navigationSource).toContain('href: "/evidence"');
		expect(navigationSource).toContain('href: "/open-source"');
		expect(source).toContain("openSourceRepositories.slice(0, 6)");
		expect(source).not.toContain('id="performance"');
		expect(source).toContain('href="#top"');
	});

	it("reuses the route-level primary navigation instead of inert hash controls", () => {
		expect(source).toContain('<PortfolioPrimaryNavigation current="dashboard"');
		expect(source).not.toContain('aria-label="打开菜单"');
		expect(source).not.toContain('href="#projects"');
	});

	it("keeps the ukiyo-e surface proportional and the active route understated", () => {
		expect(styles).not.toContain("100% 100% no-repeat fixed");
		const activeRule = styles.match(
			/\.portfolio-primary-navigation a\.is-active\s*\{([^}]*)\}/,
		)?.[1];
		expect(activeRule).toBeDefined();
		expect(activeRule).not.toContain("background: #bf1737");
	});

	it("keeps card copy complete and secondary links usable without hover", () => {
		const summaryRule = styles.match(
			/\.portfolio-project-summary\s*\{([^}]*)\}/,
		)?.[1];
		const secondaryLinksRule = styles.match(
			/\.portfolio-project-secondary-links\s*\{([^}]*)\}/,
		)?.[1];

		expect(summaryRule).toBeDefined();
		expect(summaryRule).not.toContain("line-clamp");
		expect(styles).not.toContain(".portfolio-project-card h3 + p");
		expect(secondaryLinksRule).toBeDefined();
		expect(secondaryLinksRule).not.toContain("opacity: 0");
		expect(secondaryLinksRule).not.toContain("pointer-events: none");
	});
});
