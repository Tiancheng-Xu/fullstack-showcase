const INDEX_KEY = "portfolio:index";
const INSTALLATION_KEY = "github:installation-id";
const MAX_WEBHOOK_BYTES = 2_000_000;
const encoder = new TextEncoder();

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (request.method === "OPTIONS") {
			return cors(new Response(null, { status: 204 }));
		}
		if (request.method === "GET" && url.pathname === "/projects.json") {
			const envelope = await env.PORTFOLIO.get(INDEX_KEY, "json");
			return cors(
				Response.json(
					envelope ?? {
						schemaVersion: 1,
						generatedAt: new Date(0).toISOString(),
						projectCount: 0,
						projects: [],
						status: "warming",
					},
					{ headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
				),
			);
		}
		if (request.method === "GET" && url.pathname === "/health") {
			const envelope = await env.PORTFOLIO.get(INDEX_KEY, "json");
			return Response.json({
				status: envelope ? "ready" : "warming",
				generatedAt: envelope?.generatedAt ?? null,
				projectCount: envelope?.projectCount ?? 0,
				warningCount: envelope?.warningCount ?? 0,
				fallbackSchedule: "*/30 * * * *",
				permissions: "contents:read",
			});
		}
		if (request.method !== "POST" || url.pathname !== "/webhook") {
			return new Response("Not found", { status: 404 });
		}
		return handleWebhook(request, env, ctx);
	},

	async scheduled(_controller, env, ctx) {
		const installationId = await env.PORTFOLIO.get(INSTALLATION_KEY);
		if (!installationId) {
			console.warn(JSON.stringify({
				event: "scheduled_sync_skipped",
				reason: "missing_installation",
			}));
			return;
		}
		ctx.waitUntil(refreshPortfolio(env, installationId, "scheduled"));
	},
};

async function handleWebhook(request, env, ctx) {
	const declaredLength = Number(request.headers.get("content-length") || "0");
	if (declaredLength > MAX_WEBHOOK_BYTES) {
		return new Response("Payload too large", { status: 413 });
	}
	const body = await request.arrayBuffer();
	if (body.byteLength > MAX_WEBHOOK_BYTES) {
		return new Response("Payload too large", { status: 413 });
	}
	const signature = request.headers.get("x-hub-signature-256") || "";
	if (!(await verifyWebhook(body, signature, env.GITHUB_WEBHOOK_SECRET))) {
		return new Response("Invalid signature", { status: 401 });
	}

	let payload;
	try {
		payload = JSON.parse(new TextDecoder().decode(body));
	} catch {
		return new Response("Invalid JSON", { status: 400 });
	}

	const event = request.headers.get("x-github-event") || "unknown";
	const delivery = request.headers.get("x-github-delivery") || "unknown";
	const installationId = payload?.installation?.id;
	if (installationId) {
		await env.PORTFOLIO.put(INSTALLATION_KEY, String(installationId));
	}
	if (event === "ping") {
		return Response.json({ accepted: true, event, delivery });
	}
	if (!shouldRefresh(event, payload, env)) {
		return Response.json({ accepted: false, event, reason: "filtered" }, { status: 202 });
	}
	const storedInstallation =
		installationId || (await env.PORTFOLIO.get(INSTALLATION_KEY));
	if (!storedInstallation) {
		return Response.json(
			{ accepted: false, event, reason: "missing_installation" },
			{ status: 202 },
		);
	}
	ctx.waitUntil(
		refreshPortfolio(env, String(storedInstallation), "webhook:" + event),
	);
	return Response.json({ accepted: true, event, delivery }, { status: 202 });
}

function shouldRefresh(event, payload, env) {
	if (["installation", "installation_repositories", "repository"].includes(event)) {
		return true;
	}
	if (event !== "push") return false;
	const repository = payload?.repository;
	if (!repository || repository.fork || repository.archived) return false;
	if (excludedRepositories(env).has(repository.name)) return false;
	return payload.ref === "refs/heads/" + repository.default_branch;
}

async function refreshPortfolio(env, installationId, trigger) {
	try {
		const token = await installationToken(env, installationId);
		const repositories = await installationRepositories(token);
		const excluded = excludedRepositories(env);
		const warnings = [];
		const candidates = repositories.filter(
			(repo) =>
				repo.owner?.login === env.GITHUB_OWNER &&
				!repo.fork &&
				!repo.archived &&
				!repo.disabled &&
				!excluded.has(repo.name),
		);
		const results = await Promise.all(
			candidates.map(async (repo) => {
				try {
					return await projectFromRepository(repo, token);
				} catch (error) {
					warnings.push(
						error instanceof Error ? error.message : "unknown repository error",
					);
					return null;
				}
			}),
		);
		const projects = results
			.filter(Boolean)
			.sort((left, right) => {
				const orderDelta = (left.order ?? 999) - (right.order ?? 999);
				return orderDelta || left.title.localeCompare(right.title);
			})
			.map(({ order: _order, ...project }) => project);
		const envelope = {
			schemaVersion: 1,
			generatedAt: new Date().toISOString(),
			projectCount: projects.length,
			projects,
			status: "ready",
			trigger,
			warningCount: warnings.length,
		};
		await env.PORTFOLIO.put(INDEX_KEY, JSON.stringify(envelope));
		console.log(JSON.stringify({
			event: "portfolio_sync_complete",
			trigger,
			projectCount: projects.length,
			warningCount: warnings.length,
		}));
	} catch (error) {
		console.error(JSON.stringify({
			event: "portfolio_sync_failed",
			trigger,
			message: error instanceof Error ? error.message : "unknown error",
		}));
		throw error;
	}
}

async function projectFromRepository(repo, token) {
	const manifestText = await repositoryFile(
		repo.full_name,
		".github/baby2b-publish.yml",
		repo.default_branch,
		token,
	);
	if (!manifestText) return null;
	const manifest = parseFlatYaml(manifestText);
	const evidenceUrl = manifest["evidence-url"];
	if (
		manifest["schema-version"] !== "1" ||
		!manifest.slug ||
		!evidenceUrl?.startsWith("https://evidence.baby2b.online/")
	) {
		throw new Error("publish manifest rejected by portfolio contract");
	}
	const metadataText = await repositoryFile(
		repo.full_name,
		".github/portfolio-project.json",
		repo.default_branch,
		token,
	);
	const metadata = metadataText ? parseProjectMetadata(metadataText) : {};
	if (metadata.visible === false) return null;
	const description =
		metadata.desc ||
		repo.description ||
		"该项目通过标准发布清单接入 Baby2B 作品集与 Evidence 链路。";
	const status = metadata.status === "进行中" ? "进行中" : "已完成";
	const progress = clampNumber(metadata.progress, status === "已完成" ? 100 : 50);
	return {
		id: manifest.slug,
		title: metadata.title || titleize(repo.name),
		desc: description,
		status,
		progress,
		architecture:
			metadata.architecture ||
			"GitHub 仓库 + 共享质量门禁 + Cloudflare 发布链路 + Evidence 工作证明。",
		evidenceUrl,
		repo: repo.full_name,
		skills: stringArray(metadata.skills, repo.topics?.slice(0, 6) || []),
		evidence: stringArray(metadata.evidence, [
			"仓库发布清单与线上地址一致",
			"Evidence 页面提供架构、验证与限制说明",
		]),
		details: stringArray(metadata.details, [
			description,
			"项目元数据由 Portfolio Sync 自动读取并发布；同步失败不影响主站静态回退。",
		]),
		ownerPage: manifest["production-url"] || repo.html_url,
		sourceUpdatedAt: repo.updated_at,
		order: clampNumber(metadata.order, 999),
	};
}

async function installationRepositories(token) {
	const repositories = [];
	for (let page = 1; page <= 10; page += 1) {
		const response = await githubRequest(
			"/installation/repositories?per_page=100&page=" + page,
			token,
		);
		repositories.push(...(response.repositories || []));
		if ((response.repositories || []).length < 100) break;
	}
	return repositories;
}

async function repositoryFile(fullName, filePath, ref, token) {
	const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
	const response = await fetch(
		"https://api.github.com/repos/" + fullName + "/contents/" +
			encodedPath + "?ref=" + encodeURIComponent(ref),
		{
			headers: {
				Accept: "application/vnd.github.raw+json",
				Authorization: "Bearer " + token,
				"User-Agent": "tiancheng-portfolio-sync",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);
	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error("repository file request failed (" + response.status + ")");
	}
	return response.text();
}

async function installationToken(env, installationId) {
	const jwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY);
	const response = await fetch(
		"https://api.github.com/app/installations/" +
			encodeURIComponent(installationId) + "/access_tokens",
		{
			method: "POST",
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: "Bearer " + jwt,
				"User-Agent": "tiancheng-portfolio-sync",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			body: JSON.stringify({ permissions: { contents: "read" } }),
		},
	);
	if (!response.ok) {
		throw new Error("installation token request failed (" + response.status + ")");
	}
	const payload = await response.json();
	if (!payload.token) throw new Error("installation token missing");
	return payload.token;
}

async function githubRequest(path, token) {
	const response = await fetch("https://api.github.com" + path, {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: "Bearer " + token,
			"User-Agent": "tiancheng-portfolio-sync",
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	if (!response.ok) {
		throw new Error("GitHub API request failed (" + response.status + ")");
	}
	return response.json();
}

async function createAppJwt(appId, privateKeyPem) {
	const now = Math.floor(Date.now() / 1000);
	const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const payload = base64Url(
		JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }),
	);
	const input = header + "." + payload;
	const key = await crypto.subtle.importKey(
		"pkcs8",
		pemBytes(privateKeyPem),
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		key,
		encoder.encode(input),
	);
	return input + "." + base64Url(signature);
}

async function verifyWebhook(body, signature, secret) {
	if (!signature.startsWith("sha256=") || !secret) return false;
	const received = hexBytes(signature.slice(7));
	if (!received) return false;
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);
	return crypto.subtle.verify("HMAC", key, received, body);
}

function parseFlatYaml(source) {
	const result = {};
	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const match = line.match(/^([a-z0-9-]+):\s*(.*)$/i);
		if (!match) continue;
		result[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
	}
	return result;
}

function parseProjectMetadata(source) {
	const value = JSON.parse(source);
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("portfolio metadata must be an object");
	}
	return value;
}

function stringArray(value, fallback) {
	return Array.isArray(value)
		? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 12)
		: fallback;
}

function clampNumber(value, fallback) {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(999, Math.max(0, Math.round(value)))
		: fallback;
}

function excludedRepositories(env) {
	return new Set(
		(env.EXCLUDED_REPOSITORIES || "")
			.split(",")
			.map((name) => name.trim())
			.filter(Boolean),
	);
}

function titleize(value) {
	return value
		.split(/[-_]/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function pemBytes(pem) {
	const base64 = pem
		.replace(/-----BEGIN PRIVATE KEY-----/g, "")
		.replace(/-----END PRIVATE KEY-----/g, "")
		.replace(/\s+/g, "");
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function base64Url(value) {
	const bytes =
		typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
	let binary = "";
	for (let index = 0; index < bytes.length; index += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	}
	return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function hexBytes(value) {
	if (!/^[0-9a-f]{64}$/i.test(value)) return null;
	const bytes = new Uint8Array(value.length / 2);
	for (let index = 0; index < value.length; index += 2) {
		bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
	}
	return bytes;
}

function cors(response) {
	const headers = new Headers(response.headers);
	headers.set("Access-Control-Allow-Origin", "*");
	headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
	headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
