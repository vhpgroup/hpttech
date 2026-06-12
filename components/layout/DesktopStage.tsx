import type { ReactNode } from "react";

const desktopScaleScript = `
(function () {
  var DESIGN_WIDTH = 1440;
  var REFERENCE_VIEWPORT = 1920;
  var DESKTOP_BREAKPOINT = 1024;
  var observer;

  function readViewportWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  }

  function setDesktopScale() {
    var width = readViewportWidth();
    var scale = width >= DESKTOP_BREAKPOINT ? Math.min(1, width / REFERENCE_VIEWPORT) : 1;
    var scaledStageWidth = DESIGN_WIDTH * scale;
    var stage = document.querySelector(".desktop-stage");
    var shell = document.querySelector(".desktop-shell");

    document.documentElement.style.setProperty("--desktop-scale", scale.toFixed(4));
    document.documentElement.style.setProperty("--desktop-stage-width", Math.ceil(scaledStageWidth) + "px");

    if (stage && shell && width >= DESKTOP_BREAKPOINT) {
      document.documentElement.style.setProperty(
        "--desktop-stage-min-height",
        Math.ceil(window.innerHeight / scale) + "px"
      );
      var scaledHeight = Math.ceil(stage.scrollHeight * scale);
      shell.style.height = scaledHeight + "px";
      shell.style.minHeight = scaledHeight + "px";
    } else if (shell) {
      document.documentElement.style.removeProperty("--desktop-stage-min-height");
      shell.style.height = "";
      shell.style.minHeight = "";
    }
  }

  function observeStage() {
    var stage = document.querySelector(".desktop-stage");
    if (!stage || typeof ResizeObserver === "undefined" || observer) return;
    observer = new ResizeObserver(setDesktopScale);
    observer.observe(stage);
  }

  setDesktopScale();
  window.addEventListener("resize", setDesktopScale);
  window.addEventListener("load", function () {
    observeStage();
    setDesktopScale();
  });
  document.addEventListener("DOMContentLoaded", function () {
    observeStage();
    setDesktopScale();
  });
})();
`;

export function DesktopStageScript() {
  return <script dangerouslySetInnerHTML={{ __html: desktopScaleScript }} />;
}

export default function DesktopStage({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-shell" suppressHydrationWarning>
      <div className="desktop-stage">{children}</div>
    </div>
  );
}
