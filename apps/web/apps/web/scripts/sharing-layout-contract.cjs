const sharingRoutes = [
  "/sharing",
  "/ai-conferences",
  "/overreacted-reading-route",
  "/sharing-notes/overreacted/what-is-javascript-made-of",
  "/sharing-notes/overreacted/on-let-vs-const",
  "/sharing-notes/v8/leaving-the-sea-of-nodes",
  "/ai-conference-notes/yunqi-2026",
];

function previewOriginFromChecks(checks) {
  const check = checks.find((item) => item.name === "Cloudflare Pages");
  if (!check || check.status !== "completed") return null;
  if (check.conclusion !== "success") {
    throw new Error(`Cloudflare Pages failed: ${check.conclusion}`);
  }
  const origin = check.output?.summary?.match(
    /https:\/\/[a-z0-9-]+\.fullstack-showcase\.pages\.dev\b/,
  )?.[0];
  if (!origin) throw new Error("Cloudflare success check has no deployment preview URL");
  return origin;
}

function layoutViolations(report) {
  const failures = [];
  if (report.overflow > 1) failures.push("horizontal overflow");
  if (report.brokenImages.length) failures.push("broken images");
  if (report.clippedText.length) failures.push("clipped visible text");
  if (report.detail) {
    const titleLimit = report.width < 700 ? 32 : 48;
    if (report.title.fontSize > titleLimit + 0.1) failures.push("oversized article title");
    if (report.title.lineHeight < report.title.fontSize * 1.2) failures.push("compressed title line height");
    if (report.title.height > (report.width < 700 ? 240 : 180)) failures.push("excessive title height");
    if (Math.abs(report.heroLeft - report.bodyLeft) > 1 || Math.abs(report.heroWidth - report.bodyWidth) > 1) {
      failures.push("title and article columns are misaligned");
    }
    if (report.introGap > 33 || report.bodyGap > 33) failures.push("excessive article whitespace");
    if (report.returnPath !== "/sharing#sharing-articles") failures.push("wrong article return destination");
  }
  if (report.paragraphLinkHealthy === false) failures.push("article paragraph is not clickable");
  return failures;
}

async function inspectSharingLayout(page) {
  return page.evaluate(() => {
    const main = document.querySelector(".portfolio-index-main");
    const hero = main?.querySelector(".portfolio-index-hero");
    const title = hero?.querySelector("h1");
    if (!main || !hero || !title) throw new Error("Portfolio page shell is missing");
    const detail = main.querySelector(".sharing-article-note, .conference-original-note");
    const body = detail?.querySelector(".reading-route-body");
    const intro = detail?.querySelector(".sharing-intro");
    if (detail && (!body || !intro)) throw new Error("Article content or intro is missing");
    const heroRect = hero.getBoundingClientRect();
    const bodyRect = body?.getBoundingClientRect();
    const introRect = intro?.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const style = getComputedStyle(title);
    const clippedText = [...main.querySelectorAll("h1,h2,h3,h4,p")].filter((element) => {
      const box = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return box.width > 1 && box.height > 1 && css.display !== "none" && css.visibility !== "hidden" &&
        ["hidden", "clip"].includes(css.overflowX) && element.scrollWidth > element.clientWidth + 1;
    }).map((element) => element.textContent.slice(0, 80));
    const paragraph = main.querySelector(".sharing-directory-item-link p");
    let paragraphLinkHealthy = null;
    if (paragraph) {
      paragraph.scrollIntoView({ block: "center" });
      const box = paragraph.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + Math.min(30, box.width / 2), box.top + box.height / 2);
      const link = hit?.closest("a");
      paragraphLinkHealthy = !!link && link === paragraph.closest("a") &&
        /^\/(sharing-notes|ai-conference-notes)\//.test(new URL(link.href).pathname);
      window.scrollTo(0, 0);
    }
    const back = detail?.querySelector("a.sharing-back");
    return {
      width: window.innerWidth,
      detail: !!detail,
      overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute("src")),
      clippedText,
      title: { fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), height: titleRect.height },
      heroLeft: heroRect.left,
      heroWidth: heroRect.width,
      bodyLeft: bodyRect?.left ?? null,
      bodyWidth: bodyRect?.width ?? null,
      introGap: introRect ? introRect.top - heroRect.bottom : null,
      bodyGap: bodyRect && introRect ? bodyRect.top - introRect.bottom : null,
      returnPath: back ? new URL(back.href).pathname.replace(/\/$/, "") + new URL(back.href).hash : null,
      paragraphLinkHealthy,
    };
  });
}

module.exports = { sharingRoutes, previewOriginFromChecks, layoutViolations, inspectSharingLayout };
