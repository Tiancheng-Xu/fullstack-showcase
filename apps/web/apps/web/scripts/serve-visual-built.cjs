const { createServer } = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const { resolve, join, extname, sep } = require("node:path");

const root = resolve(__dirname, "../dist");
const port = Number(process.argv[2] || 4184);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".wasm": "application/wasm" };

// A loopback-only static-first preview, not Vite's unknown-route SPA fallback.
// It mirrors the prerendered document contract; it is not a Cloudflare deployment.
const server = createServer(async (request, response) => {
	if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
	try {
		const pathname = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
		let file = resolve(root, "." + pathname);
		if (file !== root && !file.startsWith(root + sep)) { response.writeHead(400); response.end(); return; }
		let status = 200;
		try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); await stat(file); }
		catch { file = join(root, "404.html"); status = 404; }
		const body = await readFile(file);
		response.writeHead(status, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
		response.end(request.method === "HEAD" ? undefined : body);
	} catch { response.writeHead(500); response.end(); }
});
server.listen(port, "127.0.0.1", () => console.log(`Built static-first preview: http://127.0.0.1:${port}`));
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
