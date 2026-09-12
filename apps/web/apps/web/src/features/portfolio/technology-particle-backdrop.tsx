import { useEffect, useRef, useState } from "react";

import {
  getOpenSourceRepositoryAssetKey,
  getOpenSourceRepositoryIconSrc,
  OPEN_SOURCE_REPOSITORY_ICON_FALLBACK,
  openSourceRepositoryDetails,
} from "./open-source-data";
import type { CapabilityParticleController } from "./technology-capability-particle-scene";
import { hasWebGLSupport, shouldEnableVoyageScene } from "./voyage-scene-policy";

export const OPEN_SOURCE_PARTICLE_DOMAINS = [
  {
    nodes: openSourceRepositoryDetails.map((repository) => ({
      id: `open-source-${getOpenSourceRepositoryAssetKey(repository.href) ?? repository.project}`,
      iconSrc: getOpenSourceRepositoryIconSrc(repository.href),
      fallbackIconSrc: OPEN_SOURCE_REPOSITORY_ICON_FALLBACK,
      particleLabel: repository.project,
    })),
  },
] as const;

export function TechnologyParticleBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<CapabilityParticleController | null>(null);
  const [sceneState, setSceneState] = useState<"static" | "loading" | "active" | "failed">("static");

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      !shouldEnableVoyageScene({
        reducedMotion,
        viewportWidth: window.innerWidth,
        webglAvailable: hasWebGLSupport(),
      })
    ) {
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
      if (disposed || controllerRef.current) return;
      setSceneState("loading");
      void import("./technology-capability-particle-scene")
        .then(({ mountTechnologyCapabilityParticleScene }) => {
          if (disposed || !canvasRef.current) return;
          const controller = mountTechnologyCapabilityParticleScene(
            canvasRef.current,
            OPEN_SOURCE_PARTICLE_DOMAINS,
            () => {
              if (!disposed) setSceneState("active");
            },
          );
          controllerRef.current = controller;
          controller.setPaused(false);
          controller.setRange(1);
        })
        .catch(() => {
          if (!disposed) setSceneState("failed");
        });
    };

    const scheduleMount = () => {
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
          scheduleMount();
        },
        { rootMargin: "280px 0px" },
      );
      observer.observe(root);
    } else {
      scheduleMount();
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
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="open-source-particle-backdrop"
      data-scene-state={sceneState}
      data-testid="technology-particle-backdrop"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="open-source-particle-backdrop__canvas" />
      <div className="open-source-particle-backdrop__static" />
    </div>
  );
}
