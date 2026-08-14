import {
	attachRouterServerSsrUtils,
	RouterServer,
} from "@tanstack/react-router/ssr/server";
import { renderToString } from "react-dom/server";
import { createMemoryAppRouter } from "./router";

export async function renderDashboardRoute(pathname: string) {
  const router = createMemoryAppRouter(pathname);
  attachRouterServerSsrUtils({ router, manifest: undefined });
  try {
    await router.load();
    await router.serverSsr?.dehydrate();
    const markup = renderToString(<RouterServer router={router} />);
    router.serverSsr?.setRenderFinished();
    return {
      markup,
      hydrationHtml: router.serverSsr?.takeBufferedHtml() ?? "",
    };
  } finally {
    router.serverSsr?.cleanup();
  }
}
