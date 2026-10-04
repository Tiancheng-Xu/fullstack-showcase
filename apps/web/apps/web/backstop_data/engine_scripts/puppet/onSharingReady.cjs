const { inspectSharingLayout, layoutViolations } = require("../../../scripts/sharing-layout-contract.cjs");

module.exports = async (page) => {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.addStyleTag({ content: "*,*::before,*::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }" });
  const report = await inspectSharingLayout(page);
  const failures = layoutViolations(report);
  if (failures.length) throw new Error(`Sharing layout regression: ${failures.join(", ")}`);
};
