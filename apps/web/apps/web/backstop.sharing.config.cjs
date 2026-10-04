const base = require("./backstop.config.cjs");
const { sharingRoutes } = require("./scripts/sharing-layout-contract.cjs");
const origin = new URL(process.env.BACKSTOP_TARGET_ORIGIN || "https://baby2b.online");
if (origin.protocol !== "https:" || origin.username || origin.password || origin.port || origin.pathname !== "/" || origin.search || origin.hash ||
  !(origin.hostname === "baby2b.online" || /^[a-z0-9-]+\.fullstack-showcase\.pages\.dev$/.test(origin.hostname))) {
  throw new Error("Sharing Backstop requires the production or commit-specific remote Pages origin");
}
module.exports = {
  ...base,
  id: "portfolio_sharing",
  scenarios: sharingRoutes.map((route) => ({
    label: route.slice(1).replaceAll("/", "-"),
    url: new URL(route, origin).href,
    selectors: route.includes("-notes/") ? ["document"] : ["viewport"],
    delay: 250,
    misMatchThreshold: 0.1,
    requireSameDimensions: true,
    onBeforeScript: "puppet/onBefore.cjs",
    onReadyScript: "puppet/onSharingReady.cjs",
  })),
  paths: {
    ...base.paths,
    bitmaps_reference: "backstop_data/sharing/bitmaps_reference",
    bitmaps_test: "backstop_data/sharing/bitmaps_test",
    html_report: "backstop_data/sharing/html_report",
    ci_report: "backstop_data/sharing/ci_report",
  },
  report: ["CI"],
};
