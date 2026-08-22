import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	createCsrFallbackHtml,
	STATIC_FIRST_ROUTES,
} from "./prerender-routes.mjs";

const appRoot = resolve(import.meta.dirname, "..");
const distDir = resolve(appRoot, "dist");
const ssrDir = resolve(appRoot, ".ssr-dashboard");
const template = await readFile(resolve(distDir, "index.html"), "utf8");
const { renderDashboardRoute } = await import(
	pathToFileURL(resolve(ssrDir, "entry-server.js"))
);
const csrFallbackHtml = createCsrFallbackHtml(template);

for (const route of STATIC_FIRST_ROUTES) {
	const { hydrationHtml, markup } = await renderDashboardRoute(route.url);
	const routeHtml = csrFallbackHtml
		.replace(
			"</head>",
			'  <meta name="static-first" content="ssg-hydrate-csr" />\n  </head>',
		)
		.replace(
			'<div id="app"></div>',
			`<div id="app" data-render-mode="ssg">${markup}</div>`,
		)
		.replace("</body>", `${hydrationHtml}</body>`);
	const outputPath = resolve(distDir, route.output);
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, routeHtml, "utf8");
}

await writeFile(resolve(distDir, "index.html"), csrFallbackHtml, "utf8");
await writeFile(
	resolve(distDir, "static-first-manifest.json"),
	`${JSON.stringify({ schemaVersion: 1, mode: "ssg-hydrate-csr", generatedAt: new Date().toISOString(), routes: STATIC_FIRST_ROUTES.map((route) => route.url) }, null, 2)}\n`,
	"utf8",
);
await rm(ssrDir, { recursive: true, force: true });
console.log(`Prerendered ${STATIC_FIRST_ROUTES.length} static-first routes.`);
