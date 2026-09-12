import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const scene = vi.hoisted(() => ({
  dispose: vi.fn(),
  mount: vi.fn(),
  setPaused: vi.fn(),
  setRange: vi.fn(),
}));

const policy = vi.hoisted(() => ({
  webglAvailable: true,
  shouldEnable: vi.fn(
    ({ reducedMotion, viewportWidth, webglAvailable }) =>
      !reducedMotion && viewportWidth >= 760 && webglAvailable,
  ),
}));

vi.mock("../voyage-scene-policy", () => ({
  hasWebGLSupport: () => policy.webglAvailable,
  shouldEnableVoyageScene: policy.shouldEnable,
}));

vi.mock("../technology-capability-particle-scene", () => ({
  mountTechnologyCapabilityParticleScene: scene.mount,
}));

import { TechnologyCapabilityMap } from "../technology-capability-map";

describe("TechnologyCapabilityMap", () => {
  let innerWidthSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    policy.webglAvailable = true;
    innerWidthSpy = vi.spyOn(window, "innerWidth", "get").mockReturnValue(1280);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
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
    vi.stubGlobal(
      "requestIdleCallback",
      (callback: IdleRequestCallback) => {
        callback({ didTimeout: false, timeRemaining: () => 50 });
        return 1;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders four domains with six featured technologies each in SSR-safe DOM", () => {
		const { container } = render(<TechnologyCapabilityMap />);

    expect(
      screen.getByRole("heading", { name: "徐天成" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("capability-domain")).toHaveLength(4);
		expect(screen.getAllByTestId("capability-node")).toHaveLength(24);
		expect(screen.getAllByRole("button", { name: /更多技能 \+6/ })).toHaveLength(4);
		expect(
			screen.queryByRole("button", { name: "暂停图谱动效" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("slider", { name: "图谱范围" })).not.toBeInTheDocument();
		expect(
			container.querySelector("canvas.technology-map__particle-canvas"),
		).toBeInTheDocument();
  });

  it("feeds all 48 capabilities to the deferred Babylon scene", async () => {
    render(<TechnologyCapabilityMap />);

    await waitFor(() => expect(scene.mount).toHaveBeenCalledTimes(1));
    const domains = scene.mount.mock.calls[0][1];
    const nodeIds = domains.flatMap((domain: { nodes: Array<{ id: string }> }) =>
      domain.nodes.map((node) => node.id),
    );

    expect(nodeIds).toHaveLength(48);
    expect(new Set(nodeIds).size).toBe(48);
    expect(scene.setPaused).toHaveBeenCalledWith(false);
    expect(scene.setRange).toHaveBeenCalledWith(1);
  });

  it("keeps the Babylon scene static when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<TechnologyCapabilityMap />);

    expect(policy.shouldEnable).toHaveBeenCalledWith(
      expect.objectContaining({ reducedMotion: true }),
    );
    expect(scene.mount).not.toHaveBeenCalled();
  });

  it("keeps the Babylon scene static without WebGL", () => {
    policy.webglAvailable = false;

    render(<TechnologyCapabilityMap />);

    expect(policy.shouldEnable).toHaveBeenCalledWith(
      expect.objectContaining({ webglAvailable: false }),
    );
    expect(scene.mount).not.toHaveBeenCalled();
  });

  it("keeps the Babylon scene static on a narrow viewport", () => {
    innerWidthSpy.mockReturnValue(480);

    render(<TechnologyCapabilityMap />);

    expect(policy.shouldEnable).toHaveBeenCalledWith(
      expect.objectContaining({ viewportWidth: 480 }),
    );
    expect(scene.mount).not.toHaveBeenCalled();
  });

  it("keeps the Babylon scene static while the tablet layout hides its canvas", () => {
    innerWidthSpy.mockReturnValue(800);

    render(<TechnologyCapabilityMap />);

    expect(policy.shouldEnable).toHaveBeenCalledWith(
      expect.objectContaining({ viewportWidth: 800 }),
    );
    expect(scene.mount).not.toHaveBeenCalled();
  });

  it("expands secondary skills for one domain without overloading the initial view", () => {
    render(<TechnologyCapabilityMap />);

    fireEvent.click(screen.getAllByRole("button", { name: /更多技能 \+6/ })[0]);

    expect(screen.getAllByTestId("capability-node")).toHaveLength(30);
    expect(screen.getByRole("button", { name: "Intent Routing，查看能力说明" })).toBeVisible();
    expect(screen.getByRole("button", { name: "收起技能" })).toHaveAttribute("aria-expanded", "true");
  });

  it("opens a technology detail and closes it with Escape", () => {
    render(<TechnologyCapabilityMap />);

    const trigger = screen.getByRole("button", { name: /Qwen3 \/ QLoRA/ });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: /Qwen3 \/ QLoRA/ });
    expect(dialog).toBeVisible();
    const closeButton = within(dialog).getByRole("button", { name: "关闭能力说明" });
    const projectLink = within(dialog).getByRole("link", { name: /查看关联项目/ });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(projectLink).toHaveFocus();
    expect(within(dialog).getByText(/用少量领域数据低成本训练大模型/)).toBeVisible();
    expect(projectLink).toHaveAttribute(
      "href",
      expect.stringContaining("personal-ai-agent"),
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
