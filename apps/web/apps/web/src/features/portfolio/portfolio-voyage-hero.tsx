import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  hasWebGLSupport,
  shouldEnableVoyageScene,
} from "./voyage-scene-policy";
import { PretextRevealTitle } from "./pretext-reveal-title";
import type {
	PortfolioVoyageSceneController,
	VoyageCameraPreset,
} from "./portfolio-voyage-scene";
import "./portfolio-voyage-hero.css";

type PortfolioVoyageHeroProps = {
  forceStatic?: boolean;
};

export function VoyageLoadingOverlay({ progress }: { progress: number }) {
	const value = Math.max(0, Math.min(100, Math.round(progress)));
	const stage =
		value < 36
			? "正在载入游艇与材质"
			: value < 72
				? "正在准备浅海航行场景"
				: "正在校准海面反光与航线";

	return (
		<div className="portfolio-voyage__loader" role="status">
			<div className="portfolio-voyage__loader-vortex" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
			<div className="portfolio-voyage__loader-copy">
				<strong>INITIALIZING OCEAN ENGINE</strong>
				<b>{value}%</b>
				<small>{stage}</small>
			</div>
			<div
				className="portfolio-voyage__loader-track"
				role="progressbar"
				aria-label="航海场景加载进度"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={value}
			>
				<span style={{ "--voyage-progress": `${value}%` } as CSSProperties} />
			</div>
		</div>
	);
}

export function PortfolioVoyageHero({ forceStatic = false }: PortfolioVoyageHeroProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const twosComplementRef = useRef<HTMLDivElement>(null);
	const sceneControllerRef = useRef<PortfolioVoyageSceneController | null>(null);
	const [sceneState, setSceneState] = useState<
		"static" | "loading" | "active" | "failed"
		>("static");
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [cameraPreset, setCameraPreset] = useState<VoyageCameraPreset>("overview");

	useEffect(() => {
		if (forceStatic || typeof window.IntersectionObserver !== "function") return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		const root = canvasRef.current?.closest("main") ?? document.querySelector("main");
		if (!root) return;
		const targets = Array.from(
			root.querySelectorAll<HTMLElement>("section:not(.portfolio-voyage), section article"),
		);
		targets.forEach((target, index) => {
			target.dataset.portfolioReveal = "";
			target.style.setProperty(
				"--portfolio-reveal-delay",
				String((index % 4) * 70) + "ms",
			);
		});
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					(entry.target as HTMLElement).classList.add("portfolio-reveal--visible");
					observer.unobserve(entry.target);
				}
			},
			{ threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
		);
		targets.forEach((target) => observer.observe(target));
		return () => {
			observer.disconnect();
			targets.forEach((target) => {
				delete target.dataset.portfolioReveal;
				target.classList.remove("portfolio-reveal--visible");
				target.style.removeProperty("--portfolio-reveal-delay");
			});
		};
	}, [forceStatic]);

  useEffect(() => {
    if (forceStatic || !canvasRef.current) return;
		const reducedMotion =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enabled = shouldEnableVoyageScene({
      reducedMotion,
      viewportWidth: window.innerWidth,
      webglAvailable: hasWebGLSupport(),
    });
    if (!enabled) return;

		let disposed = false;
		let dispose: (() => void) | undefined;
		let idleHandle: number | undefined;
		let firstPaintFrame: number | undefined;
		let settledPaintFrame: number | undefined;
		let progressTimer: number | undefined;
		const idleWindow = window as Window & {
			requestIdleCallback?: (
				callback: IdleRequestCallback,
				options?: IdleRequestOptions,
			) => number;
			cancelIdleCallback?: (handle: number) => void;
		};
		const loadScene = () => {
				if (disposed) return;
				setLoadingProgress(12);
				setSceneState("loading");
				progressTimer = window.setInterval(() => {
					setLoadingProgress((current) =>
						Math.min(92, current + Math.max(1, Math.round((94 - current) * 0.09))),
					);
				}, 140);
				void import("./portfolio-voyage-scene")
				.then(async ({ mountPortfolioVoyageScene }) => {
					if (disposed || !canvasRef.current) return;
					const controller = await mountPortfolioVoyageScene(canvasRef.current, {
						onTwosComplementScreenPosition: ({ x, y, visible }) => {
							const label = twosComplementRef.current;
							if (!label || window.innerWidth < 768) return;
							label.style.setProperty("--voyage-twos-x", `${x * 100}%`);
							label.style.setProperty("--voyage-twos-y", `${y * 100}%`);
							label.dataset.worldVisible = visible ? "true" : "false";
						},
						onBoatScreenPosition: ({ x, y, visible }) => {
							const canvas = canvasRef.current;
							const title = titleRef.current;
							if (!canvas || !title || window.innerWidth < 768) return;

							const glyphs = title.querySelectorAll<HTMLElement>("[data-voyage-title-glyph]");
							const titleRect = title.getBoundingClientRect();
							const canvasRect = canvas.getBoundingClientRect();
							const boatX = canvasRect.left + x * canvasRect.width - titleRect.left;
							const boatY = canvasRect.top + y * canvasRect.height - titleRect.top;
							const radius = Math.max(118, titleRect.height * 1.7);
							let titleInfluence = 0;

							glyphs.forEach((glyph, index) => {
								const centerX = ((index + .5) / glyphs.length) * titleRect.width;
								const centerY = titleRect.height * .5;
								let dx = centerX - boatX;
								let dy = centerY - boatY;
								if (Math.abs(dy) < 8) dy = index % 2 === 0 ? -18 : 18;
								const distance = Math.hypot(dx, dy);
								const influence = visible ? Math.max(0, 1 - distance / radius) : 0;
								titleInfluence = Math.max(titleInfluence, influence);
								if (distance < 1) dx = index % 2 === 0 ? -1 : 1;
								const normal = Math.max(1, Math.hypot(dx, dy));
								const arc = Math.sin(influence * Math.PI);
								glyph.style.setProperty("--voyage-glyph-x", `${(dx / normal) * 42 * arc}px`);
								glyph.style.setProperty("--voyage-glyph-y", `${(dy / normal) * 34 * arc}px`);
								glyph.style.setProperty("--voyage-glyph-rotate", `${(dx / normal) * 5 * arc}deg`);
							});
							title.dataset.boatNear = titleInfluence > .08 ? "true" : "false";
						},
					});
					sceneControllerRef.current = controller;
					dispose = controller.dispose;
						if (progressTimer !== undefined) window.clearInterval(progressTimer);
						if (!disposed) {
							setLoadingProgress(100);
							window.setTimeout(() => {
								if (!disposed) setSceneState("active");
							}, 180);
						}
					})
					.catch(() => {
						if (progressTimer !== undefined) window.clearInterval(progressTimer);
						if (!disposed) setSceneState("failed");
				});
		};

		const scheduleAfterFirstPaint = () => {
			firstPaintFrame = window.requestAnimationFrame(() => {
				settledPaintFrame = window.requestAnimationFrame(() => {
					if (typeof idleWindow.requestIdleCallback === "function") {
						idleHandle = idleWindow.requestIdleCallback(loadScene, { timeout: 2400 });
					} else {
						idleHandle = window.setTimeout(loadScene, 600);
					}
				});
			});
		};
		if (document.readyState === "complete") scheduleAfterFirstPaint();
		else window.addEventListener("load", scheduleAfterFirstPaint, { once: true });

		return () => {
			disposed = true;
			window.removeEventListener("load", scheduleAfterFirstPaint);
			if (firstPaintFrame !== undefined) window.cancelAnimationFrame(firstPaintFrame);
			if (settledPaintFrame !== undefined) window.cancelAnimationFrame(settledPaintFrame);
			if (progressTimer !== undefined) window.clearInterval(progressTimer);
			if (idleHandle !== undefined) {
				if (typeof idleWindow.cancelIdleCallback === "function")
					idleWindow.cancelIdleCallback(idleHandle);
				else window.clearTimeout(idleHandle);
			}
			dispose?.();
			sceneControllerRef.current = null;
			if (twosComplementRef.current) {
				twosComplementRef.current.style.removeProperty("--voyage-twos-x");
				twosComplementRef.current.style.removeProperty("--voyage-twos-y");
				delete twosComplementRef.current.dataset.worldVisible;
			}
			if (titleRef.current) {
				delete titleRef.current.dataset.boatNear;
				for (const glyph of titleRef.current.querySelectorAll<HTMLElement>("[data-voyage-title-glyph]")) {
					glyph.style.removeProperty("--voyage-glyph-x");
					glyph.style.removeProperty("--voyage-glyph-y");
					glyph.style.removeProperty("--voyage-glyph-rotate");
				}
			}
		};
  }, [forceStatic]);

	const chooseCamera = (preset: VoyageCameraPreset) => {
		setCameraPreset(preset);
		sceneControllerRef.current?.setCameraPreset(preset);
	};

  return (
	    <section className="portfolio-voyage" data-scene-state={sceneState} aria-labelledby="portfolio-voyage-title">
			<canvas
				ref={canvasRef}
				className="portfolio-voyage__canvas"
				data-active={sceneState === "active"}
				aria-hidden="true"
			/>
      <div className="portfolio-voyage__fallback" aria-hidden="true">
        <span className="portfolio-voyage__sun">
          <img src="/assets/portfolio/twos-complement-ring.png" alt="" />
        </span>
        <span className="portfolio-voyage__mountain portfolio-voyage__mountain--back" />
        <span className="portfolio-voyage__mountain portfolio-voyage__mountain--front" />
        <span className="portfolio-voyage__sea" />
        <span className="portfolio-voyage__boat">舟</span>
      </div>
			<div
				className="portfolio-voyage__twos-complement"
				aria-hidden="true"
				ref={twosComplementRef}
			>
				<strong>TWO'S COMPLEMENT</strong>
				<span>FUNCTION NAME IS LOCATION</span>
			</div>
			<div className="portfolio-voyage__wash" />
				{sceneState === "loading" ? <VoyageLoadingOverlay progress={loadingProgress} /> : null}
      <div className="portfolio-voyage__content">
        <p>ENGINEERING VOYAGE · 2026</p>
        <h1
					data-voyage-reactive={sceneState === "active"}
					id="portfolio-voyage-title"
					ref={titleRef}
				>
					<span className="portfolio-voyage__title-pretext">
						<PretextRevealTitle text="向复杂系统深处航行" />
					</span>
					<span aria-hidden="true" className="portfolio-voyage__title-reactive">
						{Array.from("向复杂系统深处航行").map((character, index) => (
							<span data-voyage-title-glyph key={`${character}-${index}`}>
								{character}
							</span>
						))}
					</span>
				</h1>
        <div className="portfolio-voyage__rule" />
        <p className="portfolio-voyage__lead">
          从政企前中台架构，到 AI Agent、Web3 与 Cloud / Edge 工程；每一段航程都用可运行代码和可追溯 Evidence 落锚。
        </p>
        <a href="#technology-map">探索技术图谱</a>
      </div>
			<div className="portfolio-voyage__camera-controls" aria-label="航海镜头视角">
				{([
					["overview", "全景"],
					["follow", "跟船"],
					["horizon", "低空"],
				] as const).map(([preset, label]) => (
					<button
						key={preset}
						type="button"
						disabled={sceneState !== "active"}
						aria-pressed={cameraPreset === preset}
						onClick={() => chooseCamera(preset)}
					>
						{label}
					</button>
				))}
			</div>
      <p className="portfolio-voyage__credit">
        Ship model: SS Minnow III by gogiart · CC BY 4.0
      </p>
    </section>
  );
}
