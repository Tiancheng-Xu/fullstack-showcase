import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const scene = vi.hoisted(() => ({
  dispose: vi.fn(),
  mount: vi.fn(),
  setPaused: vi.fn(),
  setRange: vi.fn(),
}));

const policy = vi.hoisted(() => ({
  allow: true,
  shouldEnable: vi.fn(() => policy.allow),
}));

vi.mock("../voyage-scene-policy", () => ({
  hasWebGLSupport: () => true,
  shouldEnableVoyageScene: policy.shouldEnable,
}));

vi.mock("../technology-capability-particle-scene", () => ({
  mountTechnologyCapabilityParticleScene: scene.mount,
}));

import { TechnologyParticleBackdrop } from "../technology-particle-backdrop";
import { openSourceRepositoryDetails } from "../open-source-data";

describe("TechnologyParticleBackdrop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    policy.allow = true;
    scene.mount.mockImplementation((_canvas, _domains, onReady) => {
      onReady();
      return {
        dispose: scene.dispose,
        setPaused: scene.setPaused,
        setRange: scene.setRange,
      };
    });
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders a static SSR-safe backdrop before Babylon is available", () => {
    policy.allow = false;
    render(<TechnologyParticleBackdrop />);

    expect(screen.getByTestId("technology-particle-backdrop")).toHaveAttribute(
      "data-scene-state",
      "static",
    );
    expect(scene.mount).not.toHaveBeenCalled();
  });

  it("deferred-mounts the repository particle scene", async () => {
    render(<TechnologyParticleBackdrop />);

    await waitFor(() => expect(scene.mount).toHaveBeenCalledTimes(1));
    const domains = scene.mount.mock.calls[0][1];
    expect(domains.flatMap((domain: { nodes: unknown[] }) => domain.nodes)).toHaveLength(
      openSourceRepositoryDetails.length,
    );
    expect(scene.setPaused).toHaveBeenCalledWith(false);
    expect(scene.setRange).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("technology-particle-backdrop")).toHaveAttribute(
      "data-scene-state",
      "active",
    );
  });
});
