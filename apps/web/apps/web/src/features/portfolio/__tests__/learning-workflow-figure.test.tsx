import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LearningWorkflowFigure } from "../learning-workflow-figure";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("learning workflow figure", () => {
	it("renders a compact lazy thumbnail and a closed dialog in the server document", () => {
		const html = renderToString(<LearningWorkflowFigure />);
		expect(html).toContain("智能客服工作流");
		expect(html).toContain('loading="lazy"');
		expect(html).not.toContain(" open=");
		const { container } = render(<LearningWorkflowFigure />);
		expect(container.querySelector("figure")).toHaveClass("max-w-xs");
		expect(screen.getByRole("link", { name: "放大智能客服工作流图" })).toHaveAttribute("href", "/portfolio/learning/customer-support-workflow-20261018.png");
	});
	it("opens the native modal from the thumbnail and closes via its explicit control", () => {
		const { container } = render(<LearningWorkflowFigure />);
		const dialog = container.querySelector("dialog") as HTMLDialogElement;
		const show = vi.fn(() => dialog.setAttribute("open", ""));
		const close = vi.fn(() => dialog.removeAttribute("open"));
		Object.defineProperty(dialog, "showModal", { configurable: true, value: show });
		Object.defineProperty(dialog, "close", { configurable: true, value: close });
		fireEvent.click(screen.getByRole("link", { name: "放大智能客服工作流图" }));
		expect(show).toHaveBeenCalledOnce();
		expect(screen.getByRole("dialog", { name: "智能客服工作流" })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "关闭工作流大图" }));
		expect(close).toHaveBeenCalledOnce();
		expect(dialog).not.toHaveAttribute("open");
	});
	it("keeps image clicks open, closes on backdrop clicks and retains an original-image fallback", () => {
		const { container } = render(<LearningWorkflowFigure />);
		const dialog = container.querySelector("dialog") as HTMLDialogElement;
		const close = vi.fn();
		Object.defineProperty(dialog, "close", { configurable: true, value: close });
		vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 10, top: 10, right: 100, bottom: 100 } as DOMRect);
		fireEvent.click(dialog.querySelector("img") as HTMLImageElement);
		expect(close).not.toHaveBeenCalled();
		fireEvent.click(dialog, { clientX: 20, clientY: 20 });
		expect(close).not.toHaveBeenCalled();
		fireEvent.click(dialog, { clientX: 1, clientY: 1 });
		expect(close).toHaveBeenCalledOnce();
		const original = container.querySelector("dialog a");
		expect(dialog.querySelector("img")).toHaveAttribute("loading", "lazy");
		expect(original).toHaveAttribute("target", "_blank");
		expect(original).toHaveAttribute("rel", "noreferrer");
	});
	it("supports scrollable original-size detail and resets zoom on native close", () => {
		const { container } = render(<LearningWorkflowFigure />);
		const dialog = container.querySelector("dialog") as HTMLDialogElement;
		dialog.setAttribute("open", "");
		fireEvent.click(screen.getByRole("button", { name: "放大细节" }));
		expect(screen.getByRole("button", { name: "适应窗口" })).toHaveAttribute("aria-pressed", "true");
		expect(dialog.querySelector("img")).toHaveStyle({ width: "1586px", maxWidth: "none" });
		expect(screen.getByRole("region", { name: "工作流图片，可滚动查看细节" })).toHaveClass("overflow-auto");
		fireEvent(dialog, new Event("close"));
		expect(screen.getByRole("button", { name: "放大细节" })).toHaveAttribute("aria-pressed", "false");
	});
	it.each(["unsupported", "middle"])("retains native navigation for %s modal entry", (mode) => {
		const { container } = render(<LearningWorkflowFigure />);
		const dialog = container.querySelector("dialog") as HTMLDialogElement;
		const show = vi.fn();
		Object.defineProperty(dialog, "showModal", { configurable: true, value: mode === "unsupported" ? undefined : show });
		const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: mode === "middle" ? 1 : 0 });
		screen.getByRole("link", { name: "放大智能客服工作流图" }).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(show).not.toHaveBeenCalled();
	});
	it.each(["metaKey", "ctrlKey", "shiftKey", "altKey"])("preserves native original-image navigation with %s", (modifier) => {
		const { container } = render(<LearningWorkflowFigure />);
		const dialog = container.querySelector("dialog") as HTMLDialogElement;
		const show = vi.fn();
		Object.defineProperty(dialog, "showModal", { configurable: true, value: show });
		const link = screen.getByRole("link", { name: "放大智能客服工作流图" });
		const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, [modifier]: true });
		link.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(show).not.toHaveBeenCalled();
	});
});
