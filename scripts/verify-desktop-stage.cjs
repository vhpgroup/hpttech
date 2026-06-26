const fs = require("fs");

const css = fs.readFileSync("styles.css", "utf8");
const stage = fs.readFileSync("components/layout/DesktopStage.tsx", "utf8");
const layout = fs.readFileSync("app/(site)/layout.tsx", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Layout phải là container co giãn căn giữa, KHÔNG dùng transform scale.
assert(
  !css.includes("transform: scale(var(--desktop-scale))"),
  "Layout không được scale: phải bỏ transform scale.",
);
assert(
  !/\.desktop-stage[^{}]*\{[^}]*min-width:\s*var\(--design-width\)/s.test(css),
  ".desktop-stage không được ghim min-width = design-width.",
);
assert(css.includes("--design-width"), "Vẫn cần biến --design-width làm max-width.");

// --shell-width ở desktop phải co giãn theo 100vw, không phải = design-width cứng.
assert(
  /--shell-width:\s*min\(\s*var\(--design-width\)[^;]*100vw/s.test(css),
  "--shell-width phải co giãn: min(design-width, 100vw - gutter).",
);

// Không còn cơ chế scale trong JS / che biến trong layout.
assert(
  !stage.includes("REFERENCE_VIEWPORT") && !stage.includes("--desktop-scale"),
  "DesktopStage không còn script tính scale.",
);
assert(
  !layout.includes("--desktop-scale") && !layout.includes("DesktopStageScript"),
  "layout.tsx không còn inline --desktop-scale / DesktopStageScript.",
);

console.log("Hợp đồng layout fluid: OK.");
