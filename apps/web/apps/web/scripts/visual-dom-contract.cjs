async function inspectMobileNavigation() {
	if (innerWidth >= 768) return { healthy: true, applicable: false };
	const bar = document.querySelector(".portfolio-glass-mobile-nav");
	const links = [...(bar?.querySelectorAll(".portfolio-primary-navigation a") || [])];
	if (!bar || links.length !== 4 || getComputedStyle(bar).position !== "fixed") return { healthy: false };
	const visible = (node) => {
		for (let current = node; current instanceof Element; current = current.parentElement) {
			const style = getComputedStyle(current);
			if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity || 1) <= 0) return false;
		}
		return true;
	};
	const check = () => {
		const frame = bar.getBoundingClientRect();
		const rectangles = links.map((link) => link.getBoundingClientRect());
		const healthy = frame.width > 0 && frame.height > 0 && visible(bar) &&
			links.every((link, index) => {
				const r = rectangles[index];
				const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
				return visible(link) && r.width >= 44 && r.height >= 44 &&
					r.left >= Math.max(0, frame.left) - 1 && r.right <= Math.min(innerWidth, frame.right) + 1 &&
					r.top >= Math.max(0, frame.top) - 1 && r.bottom <= Math.min(innerHeight, frame.bottom) + 1 &&
					Boolean(hit && link.contains(hit));
			}) && Math.max(...rectangles.map((r) => r.top)) - Math.min(...rectangles.map((r) => r.top)) <= 1;
		return { healthy, rectangles: rectangles.map((r) => ({ left: r.left, top: r.top })) };
	};
	const originalY = scrollY;
	try {
		const before = check();
		const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
		const requested = originalY < maximum ? Math.min(maximum, originalY + 240) : Math.max(0, originalY - 240);
		window.scrollTo({ top: requested, left: window.scrollX, behavior: "instant" });
		await new Promise((resolve) => requestAnimationFrame(resolve));
		const after = check();
		const moved = maximum === 0 || (Math.abs(scrollY - originalY) >= 1 && Math.abs(scrollY - requested) <= 1);
		const anchored = before.rectangles.every((r, i) => Math.abs(r.left - after.rectangles[i].left) <= 1 && Math.abs(r.top - after.rectangles[i].top) <= 1);
		return { healthy: before.healthy && after.healthy && anchored && moved, applicable: true };
	} finally {
		window.scrollTo({ top: originalY, left: window.scrollX, behavior: "instant" });
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
}

function inspectNoteBody() {
	const pathname = location.pathname.replace(/\/$/, "");
	const selector = pathname.startsWith("/sharing-notes/") ? ".sharing-article-note .reading-route-body" : pathname.startsWith("/ai-conference-notes/") ? ".conference-original-note .reading-route-body" : null;
	if (!selector) return { healthy: true, applicable: false };
	const body = document.querySelector(selector);
	if (body) {
		for (let node = body; node instanceof Element; node = node.parentElement) {
			const style = getComputedStyle(node);
			if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity || 1) <= 0) return { healthy: false, applicable: true };
		}
		const rect = body.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return { healthy: false, applicable: true };
	}
	const renderedText = (element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const parts = [];
		let text;
		while ((text = walker.nextNode())) {
			let visible = true;
			for (let node = text.parentElement; node instanceof Element; node = node.parentElement) {
				const style = getComputedStyle(node);
				if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity || 1) <= 0) { visible = false; break; }
			}
			if (!visible || !text.nodeValue?.trim()) continue;
			const range = document.createRange();
			range.selectNodeContents(text);
			if ([...range.getClientRects()].some((r) => r.width > 0 && r.height > 0)) parts.push(text.nodeValue);
		}
		return parts.join("").trim();
	};
	const texts = body ? [...body.querySelectorAll("p, li, pre")].filter((node) => !node.closest(".sharing-note-boundary, header, nav, footer")).map(renderedText).filter(Boolean) : [];
	const substantiveLength = texts.join(" ").length;
	return { healthy: Boolean(body && body.querySelector("h2, h3, h4, h5") && texts.length >= 2 && substantiveLength >= 120), substantiveLength, applicable: true };
}

function inspectHeroTitle() {
	if (location.pathname.replace(/\/$/, "") !== "/dashboard") return { healthy: true, applicable: false };
	const title = document.getElementById("portfolio-voyage-title");
	if (!title || !title.getBoundingClientRect().width || !title.getBoundingClientRect().height) return { healthy: false };
	for (let node = title; node instanceof Element; node = node.parentElement) {
		const style = getComputedStyle(node);
		if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity || 1) <= 0) return { healthy: false };
	}
	const branch = [...title.querySelectorAll(".portfolio-voyage__title-pretext, .portfolio-voyage__title-reactive")].find((node) => Number(getComputedStyle(node).opacity) >= .99);
	if (!branch || !branch.textContent?.includes("向复杂系统深处航行")) return { healthy: false };
	const glyphs = [...branch.querySelectorAll(".pretext-reveal-title__glyph, [data-voyage-title-glyph], .pretext-reveal-title__fallback")];
	const painted = (glyph) => {
		const rect = glyph.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return false;
		for (let node = glyph; node instanceof Element; node = node.parentElement) {
			const style = getComputedStyle(node);
			if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity || 1) < .99) return false;
		}
		return true;
	};
	return { healthy: glyphs.length > 0 && glyphs.every(painted), applicable: true };
}

module.exports = { inspectMobileNavigation, inspectNoteBody, inspectHeroTitle };
