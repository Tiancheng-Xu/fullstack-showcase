import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiConferenceOriginalNoteContent } from "../ai-conference-original-note-content";
import { conferenceEntries } from "../sharing-data";

describe("conference note heading hierarchy", () => {
	it("keeps one page h1 and nests original Markdown headings without changing text", () => {
		render(<><h1>会议总结</h1><AiConferenceOriginalNoteContent entry={conferenceEntries[0]} markdown={"# 原笔记标题\n\n## 核心论点\n\n### 技术判断\n\n#### 边界说明\n\n保留原笔记正文。"} /></>);
		expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
		for (const [level, name] of [[2, "原笔记标题"], [3, "核心论点"], [4, "技术判断"], [5, "边界说明"]] as const) {
			expect(screen.getByRole("heading", { level, name })).toBeInTheDocument();
		}
		expect(screen.getByText("保留原笔记正文。")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "← 返回文章列表" })).toHaveAttribute("href", "/sharing#sharing-articles");
	});
});
