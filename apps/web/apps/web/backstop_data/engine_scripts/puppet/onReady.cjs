module.exports = async (page) => {
	await page.evaluate(async () => {
		await document.fonts.ready;
		const style = document.createElement("style");
		style.dataset.visualGate = "true";
		style.textContent = `
			*, *::before, *::after {
				animation: none !important;
				caret-color: transparent !important;
				transition: none !important;
			}
			html { scroll-behavior: auto !important; }
		`;
		document.head.append(style);
	});
	const pageHeight = await page.evaluate(
		() => document.documentElement.scrollHeight,
	);
	for (let y = 0; y < pageHeight; y += 720) {
		await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
		await new Promise((resolve) => setTimeout(resolve, 35));
	}
	await page.evaluate(async () => {
		await Promise.all(
			[...document.querySelectorAll(".portfolio-archify-image")].map((image) =>
				image.complete && image.naturalWidth > 0
					? Promise.resolve()
					: new Promise((resolve) => {
							const finish = () => resolve();
							image.addEventListener("load", finish, { once: true });
							image.addEventListener("error", finish, { once: true });
							setTimeout(finish, 5_000);
						}),
			),
		);
	});
	await page.evaluate(() => window.scrollTo(0, 0));
	await new Promise((resolve) => setTimeout(resolve, 300));

	const gate = await page.evaluate(async () => {
		const routeMarkers = {
			"/dashboard": "展示看板",
			"/projects": "项目索引",
			"/evidence": "工作证明索引",
			"/performance-control/babysteps": "性能观测成本控制",
		};
		const response = await fetch(window.location.pathname, {
			headers: { accept: "text/html" },
		});
		const architectureGeometry = [
			...document.querySelectorAll(".portfolio-archify-viewport"),
		].map((viewport) => {
			const diagram = viewport.querySelector("img");
			return {
				clientWidth: viewport.clientWidth,
				frameMinWidth:
					diagram instanceof HTMLImageElement
						? getComputedStyle(diagram).minWidth
						: null,
				scrollWidth: viewport.scrollWidth,
			};
		});
		let mobileArchitectureInteractable = true;
		if (window.location.pathname === "/evidence" && window.innerWidth < 768) {
			for (const viewport of document.querySelectorAll(
				".portfolio-archify-viewport",
			)) {
				const diagram = viewport.querySelector("img");
				const maximumScroll = viewport.scrollWidth - viewport.clientWidth;
				viewport.scrollLeft = maximumScroll;
				await new Promise((resolve) => requestAnimationFrame(resolve));
				const reachedDiagramEnd =
					maximumScroll > 0 && viewport.scrollLeft >= maximumScroll - 1;
				viewport.scrollLeft = 0;
				mobileArchitectureInteractable &&=
					diagram instanceof HTMLImageElement &&
					diagram.complete &&
					diagram.naturalWidth > 0 &&
					getComputedStyle(diagram).pointerEvents === "none" &&
					Number.parseFloat(getComputedStyle(diagram).minWidth) >= 1024 &&
					reachedDiagramEnd;
			}
		}
		return {
			httpStatus: response.status,
			marker: document.body.innerText.includes(
				routeMarkers[window.location.pathname],
			),
			overflow:
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
			mobileArchitectureReadable: mobileArchitectureInteractable,
			architectureGeometry,
		};
	});
	if (
		gate.httpStatus !== 200 ||
		!gate.marker ||
		gate.overflow > 1 ||
		!gate.mobileArchitectureReadable
	) {
		throw new Error(`visual route gate failed: ${JSON.stringify(gate)}`);
	}
	if (page.__visualPageErrors.length > 0) {
		throw new Error(
			`visual page errors: ${JSON.stringify(page.__visualPageErrors)}`,
		);
	}
};
