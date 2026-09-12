import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  CAPABILITY_DOMAINS,
  getCapabilityNode,
  type CapabilityNode,
} from "./capability-map-data";
import type { CapabilityParticleController } from "./technology-capability-particle-scene";
import { hasWebGLSupport, shouldEnableVoyageScene } from "./voyage-scene-policy";
import "./technology-capability-map.css";

const FEATURED_NODE_LIMIT = 6;

const getFeaturedNodes = (nodes: CapabilityNode[]) => {
  const featured = nodes.filter((node) => node.featured).slice(0, FEATURED_NODE_LIMIT);
  return featured.length === FEATURED_NODE_LIMIT ? featured : nodes.slice(0, FEATURED_NODE_LIMIT);
};

export function TechnologyCapabilityMap() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneControllerRef = useRef<CapabilityParticleController | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [sceneState, setSceneState] = useState<"static" | "loading" | "active" | "failed">("static");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => new Set());

  const selectedNode = useMemo(
    () => (selectedNodeId ? getCapabilityNode(selectedNodeId) : null),
    [selectedNodeId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return undefined;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sceneEligible = shouldEnableVoyageScene({
        reducedMotion,
        viewportWidth: window.innerWidth,
        webglAvailable: hasWebGLSupport(),
      });
    if (window.innerWidth <= 900 || !sceneEligible) {
      return undefined;
    }

    let disposed = false;
    let observer: IntersectionObserver | undefined;
    let idleHandle: number | undefined;
    let paintFrame: number | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const mountScene = () => {
      if (disposed || sceneControllerRef.current) return;
      setSceneState("loading");

      void import("./technology-capability-particle-scene")
        .then(({ mountTechnologyCapabilityParticleScene }) => {
          if (disposed || !canvasRef.current) return;
          const controller = mountTechnologyCapabilityParticleScene(
            canvasRef.current,
            CAPABILITY_DOMAINS,
            () => {
              if (!disposed) setSceneState("active");
            },
          );
          sceneControllerRef.current = controller;
          controller.setPaused(false);
          controller.setRange(1);
        })
        .catch(() => {
          if (!disposed) setSceneState("failed");
        });
    };

    const scheduleLoad = () => {
      paintFrame = window.requestAnimationFrame(() => {
        if (typeof idleWindow.requestIdleCallback === "function") {
          idleHandle = idleWindow.requestIdleCallback(mountScene, { timeout: 1800 });
        } else {
          idleHandle = window.setTimeout(mountScene, 400);
        }
      });
    };

    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          observer?.disconnect();
          scheduleLoad();
        },
        { rootMargin: "240px 0px" },
      );
      observer.observe(section);
    } else {
      scheduleLoad();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      if (paintFrame !== undefined) window.cancelAnimationFrame(paintFrame);
      if (idleHandle !== undefined) {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(idleHandle);
        } else {
          window.clearTimeout(idleHandle);
        }
      }
      sceneControllerRef.current?.dispose();
      sceneControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedNode) return undefined;

    const dialog = dialogRef.current;
    const previousTrigger = triggerRef.current;
    const focusable = dialog
      ? Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];
    focusable[0]?.focus();

    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedNodeId(null);
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKey);
    return () => {
      document.removeEventListener("keydown", handleDialogKey);
      previousTrigger?.focus();
    };
  }, [selectedNode]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((current) => {
      const next = new Set(current);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  return (
    <section
      ref={sectionRef}
      className="technology-map"
      id="technology-map"
      data-scene-state={sceneState}
      aria-labelledby="technology-map-title"
    >
      <canvas
        ref={canvasRef}
        className="technology-map__particle-canvas technology-map__canvas"
        aria-hidden="true"
        data-active={sceneState === "active"}
        data-scene-state={sceneState}
      />
      <div className="technology-map__atmosphere" aria-hidden="true" />

      <header className="technology-map__header">
        <p className="technology-map__eyebrow">CAPABILITY CONSTELLATION</p>
        <div>
          <h2 id="technology-map-title">岗位 × 技能知识图谱</h2>
          <p>默认展示核心能力；展开或悬浮节点，可查看术语别名、大白话解释和岗位沟通切入点。</p>
        </div>
      </header>

      <div
        className="technology-map__stage"
        data-paused={false}
        style={{ "--map-range": 1 } as CSSProperties}
      >
        <svg className="technology-map__orbits" aria-hidden="true" viewBox="0 0 1200 720">
          <ellipse cx="600" cy="360" rx="202" ry="142" />
          <ellipse cx="600" cy="360" rx="394" ry="270" />
          <path d="M600 360 258 196M600 360 948 188M600 360 974 542M600 360 246 548" />
        </svg>
        <article className="technology-map__identity" aria-label="个人能力定位">
          <p className="technology-map__identity-kicker">FULL STACK · AI AGENT</p>
          <h3>徐天成</h3>
          <p>全栈 · AI Agent · Cloud / Trust 工程师</p>
          <small>BUILD · CONNECT · VERIFY</small>
        </article>

        <div className="technology-map__domains">
          {CAPABILITY_DOMAINS.map((domain) => {
            const expanded = expandedDomains.has(domain.id);
            const featuredNodes = getFeaturedNodes(domain.nodes);
            const visibleNodes = expanded ? domain.nodes : featuredNodes;
            const hiddenCount = Math.max(0, domain.nodes.length - featuredNodes.length);

            return (
              <section
                key={domain.id}
                data-domain={domain.id}
                data-expanded={expanded}
                data-testid="capability-domain"
                className={`technology-map__domain technology-map__domain--${domain.tone}`}
              >
                <div className="technology-map__domain-title technology-map__domain-heading">
                  <span>{domain.eyebrow}</span>
                  <div>
                    <h3>{domain.title}</h3>
                    <p>{domain.summary}</p>
                  </div>
                </div>

                <div className="technology-map__nodes">
                  {visibleNodes.map((node, nodeIndex) => (
                    <button
                      key={node.id}
                      type="button"
                      className="technology-map__node"
                      data-testid="capability-node"
                      aria-label={`${node.label}，查看能力说明`}
                      aria-describedby={`capability-tooltip-${node.id}`}
                      onClick={(event) => {
                        triggerRef.current = event.currentTarget;
                        setSelectedNodeId(node.id);
                      }}
                      data-tooltip-align={nodeIndex % 3 === 0 ? "left" : nodeIndex % 3 === 2 ? "right" : "center"}
                      style={{ "--node-delay": `${nodeIndex * 45}ms` } as CSSProperties}
                    >
                      <span className="technology-map__node-icon" aria-hidden="true">
                        <img src={`/assets/portfolio/tech-icons/${node.iconSlug}.svg`} alt="" loading="lazy" />
                      </span>
                      <span className="technology-map__node-label">{node.label}</span>
                      <span
                        className="technology-map__node-tooltip"
                        id={`capability-tooltip-${node.id}`}
                        role="tooltip"
                      >
                        <strong>{node.aliases.length ? node.aliases.join(" · ") : node.label}</strong>
                        <span>{node.plainLanguage}</span>
                        <small>交流：{node.interviewAngle}</small>
                        <em>项目：{node.projectIds.join(" · ")}</em>
                      </span>
                    </button>
                  ))}
                </div>

                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    className="technology-map__more"
                    aria-expanded={expanded}
                    onClick={() => toggleDomain(domain.id)}
                  >
                    {expanded ? "收起技能" : `更多技能 +${hiddenCount}`}
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      {selectedNode ? (
        <div className="technology-map__dialog-backdrop" role="presentation" onClick={() => setSelectedNodeId(null)}>
          <article
            ref={dialogRef}
            className="technology-map__detail technology-map__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="technology-map-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="technology-map__dialog-close"
              type="button"
              aria-label="关闭能力说明"
              onClick={() => setSelectedNodeId(null)}
            >
              ×
            </button>
            <p className="technology-map__dialog-kicker">SELECTED CAPABILITY</p>
            <h3 id="technology-map-dialog-title">{selectedNode.label}</h3>
            {selectedNode.aliases.length ? (
              <p className="technology-map__dialog-aliases">也常叫：{selectedNode.aliases.join(" / ")}</p>
            ) : null}
            <p>{selectedNode.summary}</p>
            <dl>
              <div>
                <dt>大白话</dt>
                <dd>{selectedNode.plainLanguage}</dd>
              </div>
              <div>
                <dt>技术交流</dt>
                <dd>{selectedNode.interviewAngle}</dd>
              </div>
              <div>
                <dt>关联项目</dt>
                <dd>{selectedNode.projectIds.join(" · ")}</dd>
              </div>
            </dl>
            <a href={selectedNode.evidence} target="_blank" rel="noreferrer">
              {selectedNode.linkLabel ?? "查看关联项目 →"}
            </a>
          </article>
        </div>
      ) : null}
    </section>
  );
}
