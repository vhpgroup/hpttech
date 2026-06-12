const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf8");
const stage = fs.readFileSync("components/layout/DesktopStage.tsx", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(css.includes("--design-width: 1440px"), "Missing 1440px design width variable.");
assert(css.includes("--desktop-scale"), "Missing desktop scale variable.");
assert(css.includes(".desktop-shell"), "Missing desktop shell CSS.");
assert(css.includes(".desktop-stage"), "Missing desktop stage CSS.");
assert(css.includes("grid-template-columns: 260px 1180px"), "Hero shell must keep fixed sidebar/content columns.");
assert(css.includes("grid-template-columns: 804px 360px"), "Hero content must keep fixed banner/right columns.");
assert(stage.includes("REFERENCE_VIEWPORT = 1920"), "Desktop scale must keep the 1920px viewport reference.");
assert(stage.includes("DESKTOP_BREAKPOINT = 1024"), "Desktop scale must keep the desktop breakpoint.");
assert(stage.includes("width / REFERENCE_VIEWPORT"), "Desktop scale must be based on viewport/reference width.");
assert(
  stage.includes("--desktop-stage-min-height"),
  "Desktop stage height must be passed through a root CSS variable.",
);
assert(
  !stage.includes("stage.style.minHeight"),
  "Desktop stage must not mutate its inline style before React hydration.",
);
assert(
  css.includes("min-height: var(--desktop-stage-min-height, auto)"),
  "Desktop stage CSS must consume the hydration-safe height variable.",
);

const designWidth = 1440;
const referenceViewport = 1920;
const expectedSideRatio = (referenceViewport - designWidth) / referenceViewport / 2;

for (const viewport of [1920, 1600, 1440, 1366, 1280]) {
  const scale = Math.min(1, viewport / referenceViewport);
  const visualWidth = designWidth * scale;
  const sideRatio = (viewport - visualWidth) / viewport / 2;

  assert(Math.abs(sideRatio - expectedSideRatio) < 0.0001, `Side margin ratio drifted at ${viewport}px.`);
}

console.log("Desktop stage contract OK.");
