import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildCoverageAgenda,
	chunkCoverageAgenda,
	deriveFormalSourceGroups,
	writeFormalAgenda,
} from "../src/dataset/draft.js";

describe("formal draft agenda", () => {
	it("allocates review headroom without carrying source text", () => {
		const agenda = buildCoverageAgenda({
			approved: [],
			sourceGroups: ["rag", "agent", "frontend", "backend", "cloud", "web3"],
			targetTrain: 300,
		});

		expect(agenda.requested).toBe(425);
		expect(agenda.cells).toHaveLength(425);
		expect([...new Set(agenda.cells.map((cell) => cell.capability))]).toEqual(
			expect.arrayContaining([
				"learn",
				"interview",
				"architecture",
				"execute",
				"grill-me",
				"verification",
				"memory",
				"safety",
			]),
		);
		expect(agenda.cells.every((cell) => !("sourceText" in cell))).toBe(true);
		expect(agenda.cells.some((cell) => cell.interaction === "multi-turn")).toBe(
			true,
		);
		expect(agenda.cells.some((cell) => cell.interaction === "boundary")).toBe(
			true,
		);
	});

	it("splits agenda into bounded generation batches", () => {
		const agenda = buildCoverageAgenda({
			approved: [],
			sourceGroups: ["rag", "agent", "cloud"],
			targetTrain: 300,
		});
		const batches = chunkCoverageAgenda(agenda.cells, 60);

		expect(batches).toHaveLength(8);
		expect(batches.every((batch) => batch.length <= 60)).toBe(true);
		expect(batches.flat()).toEqual(agenda.cells);
	});

	it("derives course source groups without skill-library noise", () => {
		expect(
			deriveFormalSourceGroups([
				{ relativePath: "00-HELLO Vibe Coding/welcome.md" },
				{ relativePath: "01-开学典礼/opening.md" },
				{ relativePath: "07-AI智能客服实战/lesson.md" },
				{ relativePath: "03-AI全栈工程师/agent.md" },
				{ relativePath: "docs/superpowers/spec.md" },
				{ relativePath: "tc-flow/README.md" },
				{ relativePath: "skills/agents/tool.md" },
				{ relativePath: "personal-skills/private.md" },
			]),
		).toEqual(["03-AI全栈工程师", "07-AI智能客服实战", "docs", "tc-flow"]);
	});

	it("writes a reproducible private agenda artifact", async () => {
		const directory = await mkdtemp(path.join(tmpdir(), "formal-agenda-"));
		const destination = path.join(directory, "formal-agenda.json");
		const agenda = await writeFormalAgenda({
			documents: [
				{ relativePath: "03-AI全栈工程师/agent.md" },
				{ relativePath: "07-AI智能客服实战/rag.md" },
				{ relativePath: "skills/ignored.md" },
			],
			approved: [],
			targetTrain: 300,
			destination,
		});

		expect(agenda.requested).toBe(425);
		expect(JSON.parse(await readFile(destination, "utf8"))).toEqual(agenda);
	});

	it("weights source groups by the square root of distinct document count", async () => {
		const directory = await mkdtemp(path.join(tmpdir(), "formal-weights-"));
		const agenda = await writeFormalAgenda({
			documents: [
				{ relativePath: "03-AI全栈工程师/a.md", contentSha256: "a" },
				{ relativePath: "03-AI全栈工程师/b.md", contentSha256: "b" },
				{ relativePath: "03-AI全栈工程师/c.md", contentSha256: "c" },
				{ relativePath: "03-AI全栈工程师/d.md", contentSha256: "d" },
				{ relativePath: "07-AI智能客服实战/only.md", contentSha256: "e" },
			],
			approved: [],
			targetTrain: 300,
			destination: path.join(directory, "formal-agenda.json"),
		});
		const counts = Object.groupBy(agenda.cells, (cell) => cell.sourceGroup);

		expect(counts["03-AI全栈工程师"]?.length ?? 0).toBeGreaterThan(
			(counts["07-AI智能客服实战"]?.length ?? 0) * 1.8,
		);
		expect(counts["07-AI智能客服实战"]?.length).toBeGreaterThan(0);
	});
});
