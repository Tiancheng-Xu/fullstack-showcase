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
		expect(project?.summaryPoints).toEqual(
			expect.arrayContaining([
				expect.stringContaining("确定性 Gate"),
				expect.stringContaining("V1 保留已验证生产 Evidence"),
				expect.stringContaining("代码 / 本地验证"),
			]),
		);
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
    expect(project?.desc).toContain("本地知识问答");
    expect(project?.desc).toContain("历史 Qwen3-8B");
    expect(project?.desc).toContain("仍按系统方案描述");
    expect(project?.architecture).toContain("低置信度 / 敏感问题转人工");
		expect(project?.summaryPoints).toEqual(
			expect.arrayContaining([
				expect.stringContaining("同一 49 条冻结集"),
				expect.stringContaining("v2 bigram F1 为 0.2146"),
				expect.stringContaining("拒绝 v3 晋级"),
				expect.stringContaining("仍按系统方案描述"),
			]),
		);
    expect(project?.skills).toEqual(
      expect.arrayContaining(["Intent Routing", "Knowledge Graph / RAG", "Human Handoff"]),
    );
  });

  it("keeps the dashboard resume summaries aligned with project data", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/portfolio/dashboard-content.tsx"),
      "utf8",
    );

		expect(source).toContain("主控本人负责的 AI Agent / Web3 产品需求、方案与交付");
		expect(source).toContain("担任高级前端并承担全栈交付职责");
		expect(source).toContain("2025.06–2026.10");
		expect(source).toContain("Agent Market 与 BabySteps 归入该兼职经历");
		expect(source).toContain("北京阿拉丁科技（兼职）");
		expect(source).toContain("全栈工程师（AI Agent / Web3）");
		expect(source).toContain("任务发布与编辑、语义分类、子任务拆解");
		expect(source).toContain("请求 ID、Webhook / SSE、消息队列和并发控制");
		expect(source).toContain("MetaMask、合约托管 / 结算、IPFS / 链上证据");
		expect(source).toContain("项目经历");
		expect(source).toContain("主控 · 私有知识产品 / 本机模型交付");
		expect(source).toContain("明确模型判断、业务规则和工具授权的分工");
		expect(source).toContain("开发扩展尚未发布，按代码 / 本地验证描述");
		expect(source).toContain("引用编号校验不等于语义支持");
		expect(source).toContain("Qwen3-8B 微调、量化与 Ollama 本机交付和静态网站分别说明");
		expect(source).toContain("OfficeFlow 办公流程 Agent");
		expect(source).toContain("当前版本采用规则提案且模型关闭");
		expect(source).toContain("不把合成数据计为真实采购业绩，OCR 增强仍待验");
		expect(source).toContain("uncertain / manual_review");
		expect(source).toContain("SLO / Runbook");
		expect(source).toContain(".text / .data / .bss");
		expect(source).toContain("函数式编程中的纯函数、不可变数据、函数组合与高阶函数");
		expect(source).toContain("浙江大学宁波理工学院");
		expect(source).toContain("全日制本科 · 学士学位");
		expect(source).toContain("xutiancheng04@gmail.com");
		expect(source).toContain("17855813990");
		expect(source).not.toMatch(/ANETU|TUG|67%|UZFI|Claw|Acons/);
	});
});
