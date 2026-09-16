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
		expect(aladdin?.title).toBe("Aladdin Web3 Agent");
		expect(aladdin?.desc).toContain("AI Agent 分布式任务调度");
		expect(aladdin?.summaryPoints).toEqual(
			expect.arrayContaining([
				expect.stringContaining("Webhook / SSE"),
				expect.stringContaining("MetaMask"),
			]),
		);
		expect(aladdin?.skills).toEqual(
			expect.arrayContaining([
				"React",
				"Next.js",
				"PostgreSQL / pgvector",
				"GraphQL",
				"IPFS",
			]),
		);
		expect(JSON.stringify(aladdin)).not.toMatch(
			/ANETU|TUG|67%|0\.21|UZFI|Claw|Acons/,
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

		expect(source).toContain("参与 AI Agent 与 Web3 平台的 Web 端和全栈协作");
		expect(source).toContain("北京阿拉丁科技（兼职）");
		expect(source).toContain("前端 / 全栈工程师（AI Agent / Web3）");
		expect(source).toContain("任务发布与编辑、语义分类、子任务拆解");
		expect(source).toContain("请求 ID、Webhook / SSE、消息队列和并发控制");
		expect(source).toContain("MetaMask、合约托管 / 结算、IPFS / 链上证据");
		expect(source).toContain("项目经历");
		expect(source).toContain("AI 智能客服与私有化模型交付");
		expect(source).toContain("候选 Agent 过滤评分");
		expect(source).toContain("低置信度转人工");
		expect(source).toContain(".text / .data / .bss");
		expect(source).toContain("函数式编程中的纯函数、不可变数据、函数组合与高阶函数");
		expect(source).toContain("浙江大学宁波理工学院");
		expect(source).toContain("全日制本科 · 学士学位");
		expect(source).toContain("xutiancheng04@gmail.com");
		expect(source).toContain("17855813990");
		expect(source).not.toMatch(/ANETU|TUG|67%|0\.21|UZFI|Claw|Acons/);
	});
});
