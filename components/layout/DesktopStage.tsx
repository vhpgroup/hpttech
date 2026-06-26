import type { ReactNode } from "react";

export default function DesktopStage({ children }: { children: ReactNode }) {
  return (
    <div className="desktop-shell">
      <div className="desktop-stage">{children}</div>
    </div>
  );
}
