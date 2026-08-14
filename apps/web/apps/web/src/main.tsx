import { RouterProvider } from "@tanstack/react-router";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { createBrowserAppRouter } from "./router";

const router = createBrowserAppRouter();

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
	await router.load();
	const app = <RouterProvider router={router} />;
	createRoot(rootElement).render(app);
	rootElement.dataset.renderMode = "csr";
} else {
	const app = <RouterClient router={router} />;
	let hydrationRoot: Root | undefined;
	let fallbackScheduled = false;
	hydrationRoot = hydrateRoot(rootElement, app, {
		onRecoverableError(error) {
			console.error("[dashboard-hydration] Recoverable mismatch; switching to CSR.", error);
			if (fallbackScheduled) return;
			fallbackScheduled = true;
			window.setTimeout(() => {
				hydrationRoot?.unmount();
				rootElement.replaceChildren();
				createRoot(rootElement).render(app);
				rootElement.dataset.renderMode = "csr-fallback";
			}, 0);
		},
	});
	rootElement.dataset.renderMode = "hydrated";
}
