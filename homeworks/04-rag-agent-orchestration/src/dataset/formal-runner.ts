import type { CoverageCell } from "./draft.js";
import {
	buildFormalExample,
	type FormalDraftSource,
	parseFormalDraftResponse,
} from "./formal-generator.js";
import type { SftExample } from "./schema.js";

export type FormalChatRequest = Readonly<{
	system: string;
	user: string;
}>;

export type FormalChatRequester = (
	request: FormalChatRequest,
) => Promise<string>;

export async function generateFormalDraft(
	options: Readonly<{
		cell: CoverageCell;
		source: FormalDraftSource;
		excerpt: string;
		request: FormalChatRequester;
	}>,
): Promise<SftExample> {
	const excerpt = options.excerpt.trim();
	if (excerpt.length === 0) {
		throw new Error("Formal draft source excerpt must not be empty");
	}
	const messageCount = options.cell.interaction === "multi-turn" ? 4 : 2;
	const content = await options.request({
		system:
			"根据课程摘录生成一条原创中文 SFT 草稿。只输出 JSON 对象，字段为 messages。不得长段照抄，不得编造，不得输出个人信息、凭据或本机路径。messages 必须从 user 开始、由 assistant 结束并严格交替。",
		user: [
			`能力：${options.cell.capability}`,
			`主题：${options.cell.topic}`,
			`交互：${options.cell.interaction}`,
			`messages 数量：${messageCount}`,
			"回答要求：先给结论，用大白话解释，包含关键边界和可验证步骤。",
			"课程摘录：",
			excerpt.slice(0, 6000),
		].join("\n"),
	});
	const response = parseFormalDraftResponse(content, options.cell.interaction);
	return buildFormalExample(options.cell, options.source, response);
}
