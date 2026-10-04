import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { previewOriginFromChecks, layoutViolations } = require("./sharing-layout-contract.cjs");
const article = () => ({
  width: 1440, detail: true, overflow: 0, brokenImages: [], clippedText: [],
  title: { fontSize: 48, lineHeight: 60, height: 120 },
  heroLeft: 290, heroWidth: 860, bodyLeft: 290, bodyWidth: 860,
  introGap: 32, bodyGap: 32, returnPath: "/sharing#sharing-articles", paragraphLinkHealthy: null,
});

describe("sharing layout regression gate", () => {
  it("rejects the oversized and misaligned production article from the incident", () => {
    const report = { ...article(), title: { fontSize: 63.36, lineHeight: 72.864, height: 145.728 }, heroLeft: 40, heroWidth: 864, introGap: 72, bodyGap: 64 };
    expect(layoutViolations(report)).toEqual([
      "oversized article title", "compressed title line height", "title and article columns are misaligned", "excessive article whitespace",
    ]);
  });
  it("accepts the compact aligned article without requiring matching pixel baselines", () => {
    expect(layoutViolations(article())).toEqual([]);
  });
  it("uses a smaller title limit on mobile", () => {
    expect(layoutViolations({ ...article(), width: 390 })).toContain("oversized article title");
    expect(layoutViolations({ ...article(), width: 390, title: { fontSize: 28.8, lineHeight: 36, height: 144 } })).toEqual([]);
  });
  it("rejects broken return navigation and paragraph hit targets", () => {
    expect(layoutViolations({ ...article(), returnPath: "/ai-conferences", paragraphLinkHealthy: false })).toEqual([
      "wrong article return destination", "article paragraph is not clickable",
    ]);
  });
  it("never uses a pending or failed Cloudflare preview", () => {
    expect(previewOriginFromChecks([{ name: "Cloudflare Pages", status: "in_progress" }])).toBeNull();
    expect(() => previewOriginFromChecks([{ name: "Cloudflare Pages", status: "completed", conclusion: "failure" }])).toThrow("Cloudflare Pages failed");
  });
  it("extracts only a remote deployment preview and rejects a success check with an unexpected URL", () => {
    expect(previewOriginFromChecks([{ name: "Cloudflare Pages", status: "completed", conclusion: "success", output: { summary: "<a href='https://880b36fd.fullstack-showcase.pages.dev'>Preview</a>" } }])).toBe("https://880b36fd.fullstack-showcase.pages.dev");
    expect(() => previewOriginFromChecks([{ name: "Cloudflare Pages", status: "completed", conclusion: "success", output: { summary: "https://attacker.example/preview" } }])).toThrow("no deployment preview URL");
  });
});
