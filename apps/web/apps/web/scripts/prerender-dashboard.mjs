import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const appRoot = resolve(import.meta.dirname, "..");
const distDir = resolve(appRoot, "dist");
const ssrDir = resolve(appRoot, ".ssr-dashboard");
const template = await readFile(resolve(distDir, "index.html"), "utf8");
const { renderDashboardRoute } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")));
const pathname = "/dashboard";
const { hydrationHtml, markup } = await renderDashboardRoute(pathname);
const dashboardHtml = template
  .replace("<html lang=\"en\">", '<html lang="zh-CN">')
  .replace("<title>web</title>", "<title>Tiancheng Xu · Showcase Dashboard</title>")
  .replace("</head>", '  <meta name="static-first" content="ssg-hydrate-csr" />\n  </head>')
  .replace('<div id="app"></div>', `<div id="app" data-render-mode="ssg">${markup}</div>`)
  .replace("</body>", `${hydrationHtml}</body>`);

const dashboardDir = resolve(distDir, "dashboard");
await mkdir(dashboardDir, { recursive: true });
await writeFile(resolve(dashboardDir, "index.html"), dashboardHtml, "utf8");
await writeFile(
  resolve(distDir, "index.html"),
  `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/dashboard"><title>Tiancheng Xu · Showcase Dashboard</title></head><body><main><h1>Showcase Dashboard</h1><p><a href="/dashboard">进入作品集 Dashboard</a></p></main></body></html>`,
  "utf8",
);
await writeFile(
  resolve(distDir, "static-first-manifest.json"),
  `${JSON.stringify({ schemaVersion: 1, mode: "ssg-hydrate-csr", generatedAt: new Date().toISOString(), routes: [pathname] }, null, 2)}\n`,
  "utf8",
);
await rm(ssrDir, { recursive: true, force: true });
console.log("Prerendered /dashboard with static-first HTML.");
