import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function readRoute(distDir, pathname) {
	const route =
		pathname === "/" ? "index.html" : `${pathname.slice(1)}/index.html`;
	try {
		return { body: await readFile(join(distDir, route)), status: 200 };
	} catch {
		return { body: await readFile(join(distDir, "404.html")), status: 404 };
	}
}

export async function verifyBuiltRouteSemantics({ distDir }) {
	const server = createServer(async (request, response) => {
		try {
			const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
			const result = await readRoute(distDir, pathname);
			response.writeHead(result.status, {
				"content-type": "text/html; charset=utf-8",
			});
			response.end(result.body);
		} catch {
			response.writeHead(500);
			response.end();
		}
	});
	await new Promise((resolveListen) =>
		server.listen(0, "127.0.0.1", resolveListen),
	);
	try {
		const address = server.address();
		if (!address || typeof address === "string")
			throw new Error("route_server_unavailable");
		const origin = `http://127.0.0.1:${address.port}`;
		const [known, unknown] = await Promise.all([
			fetch(`${origin}/dashboard`),
			fetch(`${origin}/definitely-not-a-real-route`),
		]);
		const [knownBody, unknownBody] = await Promise.all([
			known.text(),
			unknown.text(),
		]);
		if (
			known.status !== 200 ||
			!knownBody.includes("展示看板") ||
			unknown.status !== 404 ||
			!unknownBody.includes('data-render-mode="static-404"')
		) {
			throw new Error("built_route_semantics_failed");
		}
		return { knownStatus: known.status, unknownStatus: unknown.status };
	} finally {
		await new Promise((resolveClose, reject) =>
			server.close((error) => (error ? reject(error) : resolveClose())),
		);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
	await verifyBuiltRouteSemantics({ distDir: join(appRoot, "dist") });
	console.log("Built route semantics: PASS (known=200, unknown=404)");
}
