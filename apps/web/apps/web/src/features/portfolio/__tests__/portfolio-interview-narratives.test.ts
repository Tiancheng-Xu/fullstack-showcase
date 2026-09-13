import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PORTFOLIO_PROJECTS } from "../../../data/portfolio-projects";

describe("portfolio interview narratives", () => {
  it("keeps Agent Market and Aladdin as separate projects", () => {
    const project = PORTFOLIO_PROJECTS.find((item) => item.id === "agent-market");
    const aladdin = PORTFOLIO_PROJECTS.find((item) => item.id === "aladdin");

    expect(project?.title).toBe("Agent Market");
		expect(project?.desc).not.toContain("Aladdin");
    expect(project?.architecture).toContain("PostgreSQL Checkpoint");
    expect(project?.architecture).toContain("异步队列 / DLQ");
    expect(project?.skills).toEqual(
      expect.arrayContaining(["Multi-Agent", "LLM Evaluation", "Trust / Auth"]),
    );
		expect(aladdin?.title).toBe("Aladdin Web3 Agent 平台");
		expect(aladdin?.desc).toContain("Agents Marketplace");
		expect(aladdin?.skills).toEqual(
		expect.arrayContaining(["Next.js", "Mastra", "AWS Lambda"]),
	);
  });

  it("presents Personal AI Agent as an intelligent customer service system", () => {
    const project = PORTFOLIO_PROJECTS.find((item) => item.id === "personal-ai-agent");

    expect(project?.title).toContain("Personal AI Agent");
    expect(project?.desc).toContain("AI 智能客服与私有化模型交付");
    expect(project?.desc).toContain("已完成 Qwen3-8B");
    expect(project?.desc).toContain("以系统设计覆盖");
    expect(project?.architecture).toContain("低置信度 / 敏感问题转人工");
    expect(project?.skills).toEqual(
      expect.arrayContaining(["Intent Routing", "Knowledge Graph / RAG", "Human Handoff"]),
    );
  });

  it("keeps the dashboard resume summaries aligned with project data", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/dashboard-content.tsx"),
      "utf8",
    );

		expect(source).toContain("Aladdin Web3 Agent 平台");
		expect(source).toContain("Agents Marketplace Web 端建设");
    expect(source).toContain("AI 智能客服与私有化模型交付");
		expect(source).toContain("候选 Agent 过滤评分");
    expect(source).toContain("低置信度转人工");
  });
});
