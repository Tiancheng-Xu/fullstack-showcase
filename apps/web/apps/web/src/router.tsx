import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";

const commonOptions = {
  routeTree,
  defaultPreload: "intent" as const,
  scrollRestoration: true,
  defaultPendingComponent: () => <Loader />,
  context: {},
};

export function createBrowserAppRouter() {
  return createRouter(commonOptions);
}

export function createMemoryAppRouter(pathname: string) {
  return createRouter({
    ...commonOptions,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createBrowserAppRouter>;
  }
}
