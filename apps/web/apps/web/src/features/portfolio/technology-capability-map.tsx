import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
	CAPABILITY_DOMAINS,
	type CapabilityNode,
} from "./capability-map-data";
import type { CapabilityParticleController } from "./technology-capability-particle-scene";
import {
	hasWebGLSupport,
	shouldEnableVoyageScene,
} from "./voyage-scene-policy";
import "./technology-capability-map.css";

export function TechnologyCapabilityMap() {
	const [selected, setSelected] = useState<CapabilityNode | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particleController = useRef<CapabilityParticleController | null>(null);
  const allNodes = useMemo(
    () => CAPABILITY_DOMAINS.flatMap((domain) => domain.nodes),
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	useEffect(() => {
		if (!canvasRef.current) return;
		const reducedMotion =
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (
			!shouldEnableVoyageScene({
				reducedMotion,
				viewportWidth: window.innerWidth,
				webglAvailable: hasWebGLSupport(),
			})
		)
			return;

		let disposed = false;
		const timer = window.setTimeout(() => {
			void import("./technology-capability-particle-scene").then(
				({ mountTechnologyCapabilityParticleScene }) => {
					if (disposed || !canvasRef.current) return;
					particleController.current = mountTechnologyCapabilityParticleScene(
						canvasRef.current,
						CAPABILITY_DOMAINS,
					);
					particleController.current.setPaused(false);
					particleController.current.setRange(1);
				},
			);
		}, 220);

		return () => {
			disposed = true;
			window.clearTimeout(timer);
			particleController.current?.dispose();
			particleController.current = null;
		};
	}, []);

  return (
    <section
      id="technology-map"
      className="technology-map"
      aria-labelledby="technology-map-title"
    >
      <header className="technology-map__header">
        <p className="technology-map__eyebrow">04 · CAPABILITY CONSTELLATION</p>
			<div>
				<h2 id="technology-map-title">岗位 × 技能知识图谱</h2>
				<p>点选技术节点，查看对应项目与已公开的工程证据。</p>
			</div>
		</header>

		<div
			className="technology-map__stage"
			data-paused={false}
			style={{ "--map-range": 1 } as React.CSSProperties}
		>
			<canvas
				ref={canvasRef}
				className="technology-map__particle-canvas"
				aria-hidden="true"
			/>
        <svg className="technology-map__orbits" aria-hidden="true" viewBox="0 0 1200 720">
          <ellipse cx="600" cy="360" rx="202" ry="142" />
          <ellipse cx="600" cy="360" rx="394" ry="270" />
          <path d="M600 360 258 196M600 360 948 188M600 360 974 542M600 360 246 548" />
        </svg>

        <div className="technology-map__identity">
          <h3>徐天成</h3>
          <p>全栈 · AI Agent · Web3 工程师</p>
          <small>BUILD · CONNECT · VERIFY</small>
        </div>

        <div className="technology-map__domains">
          {CAPABILITY_DOMAINS.map((domain, domainIndex) => (
            <article
              key={domain.id}
              className={`technology-map__domain technology-map__domain--${domain.tone}`}
              data-testid="capability-domain"
            >
              <div className="technology-map__domain-title">
                <span>{String(domainIndex + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{domain.label}</h3>
                  <p>{domain.subtitle}</p>
                </div>
              </div>
              <div className="technology-map__nodes">
                {domain.nodes.map((node, nodeIndex) => {
							const globalIndex = allNodes.findIndex((item) => item.id === node.id);
							return (
                    <button
                      key={node.id}
                      type="button"
                      className="technology-map__node"
                      data-testid="capability-node"
                      aria-label={`${node.label}，查看项目证据`}
                      style={{ "--node-delay": `${globalIndex * 28}ms` } as React.CSSProperties}
                      onClick={() => setSelected(node)}
                    >
										<span className="technology-map__node-icon">
											<img src={`/assets/portfolio/tech-icons/${node.iconSlug}.svg`} alt="" aria-hidden="true" />
										</span>
                      <span className="technology-map__node-label">{node.label}</span>
                    </button>
									);
								})}
              </div>
            </article>
          ))}
        </div>
      </div>

      {selected ? (
        <aside
          className="technology-map__detail"
          role="dialog"
          aria-label={`${selected.label} 技术详情`}
        >
          <button type="button" aria-label="关闭技术详情" onClick={() => setSelected(null)}>
            <X aria-hidden="true" />
          </button>
          <p>SELECTED CAPABILITY</p>
          <h3>{selected.label}</h3>
          <p>{selected.summary}</p>
          <small>关联项目：{selected.projectIds.join(" · ")}</small>
          <a href={selected.evidence}>查看项目证据 →</a>
        </aside>
      ) : null}
    </section>
  );
}
