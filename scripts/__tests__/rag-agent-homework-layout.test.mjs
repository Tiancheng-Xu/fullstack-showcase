import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const homework = new URL("homeworks/04-rag-agent-orchestration/", root);

test("RAG homework has an isolated package and records the actual implementation", async () => {
	await stat(new URL("package.json", homework));
	const readme = await readFile(new URL("README.md", homework), "utf8");
	assert.match(readme, /^# RAG 与 Agent 编排/m);
	assert.match(readme, /实际实现：.*Qwen\/Qwen3-8B.*NVIDIA CUDA.*一灯学习笔记/s);
});

test("the learning notes source is documented as strictly read-only", async () => {
	const readme = await readFile(new URL("README.md", homework), "utf8");
	assert.match(readme, /\/Users\/shier\/Desktop\/一灯学习笔记/);
	assert.match(readme, /严格只读/);
});
