const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const { JSDOM } = require("jsdom");
const { inspectHeroTitle } = require("./visual-dom-contract.cjs");

function checkHero({ transparent = false, hidden = false, missing = false, transparentWrapper = false } = {}) {
	const text = "向复杂系统深处航行";
	const dom = new JSDOM(`<style>* { opacity: 1; visibility: visible; }</style><h1 id="portfolio-voyage-title" ${hidden ? 'style="visibility:hidden"' : ""}><span class="portfolio-voyage__title-pretext"><span style="opacity:${transparentWrapper ? 0 : 1}">${missing ? "" : `<span class="pretext-reveal-title__fallback" style="opacity:${transparent ? 0 : 1}">${text}</span>`}</span></span></h1>`, { url: "https://example.test/dashboard" });
	try {
		const { window } = dom;
		window.HTMLElement.prototype.getBoundingClientRect = () => new window.DOMRect(20, 100, 30, 50);
		window.document.querySelector("h1").getBoundingClientRect = () => new window.DOMRect(20, 100, 320, 90);
		return runInNewContext(`(${inspectHeroTitle.toString()})()`, { document: window.document, location: window.location, Element: window.Element, getComputedStyle: window.getComputedStyle.bind(window) });
	} finally { dom.window.close(); }
}

test("accepts a visibly painted hero fallback", () => assert.equal(checkHero().healthy, true));
test("rejects transparent glyphs rather than accepting headline text alone", () => assert.equal(checkHero({ transparent: true }).healthy, false));
test("rejects an ancestor-hidden hero headline", () => assert.equal(checkHero({ hidden: true }).healthy, false));
test("rejects a missing hero title body", () => assert.equal(checkHero({ missing: true }).healthy, false));
test("rejects a transparent intermediate wrapper around painted glyphs", () => assert.equal(checkHero({ transparentWrapper: true }).healthy, false));
