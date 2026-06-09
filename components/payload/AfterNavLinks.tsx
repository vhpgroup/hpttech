"use client";

import { useEffect } from "react";

const navLinkStyle = {
  alignItems: "center",
  borderRadius: 8,
  color: "#98a2b3",
  display: "flex",
  fontSize: 13,
  fontWeight: 600,
  gap: 9,
  padding: "9px 12px",
  textDecoration: "none",
  transition: "all 0.15s",
} as const;

const handleMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.currentTarget.style.background = "rgba(70,95,255,0.14)";
  event.currentTarget.style.color = "#d9e0ff";
};

const handleMouseLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.currentTarget.style.background = "transparent";
  event.currentTarget.style.color = "#98a2b3";
};

const collapseOpenNavGroups = () => {
  const openToggles = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav-group__toggle--open"));

  if (openToggles.length === 0) {
    return false;
  }

  openToggles.forEach((toggle) => {
    toggle.click();
  });

  return true;
};

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="16">
      {children}
    </svg>
  );
}

export default function AfterNavLinks() {
  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const timeouts: number[] = [];

    const collapseGroups = () => {
      if (cancelled) {
        return;
      }

      collapseOpenNavGroups();
    };

    frame = window.requestAnimationFrame(collapseGroups);
    timeouts.push(window.setTimeout(collapseGroups, 150), window.setTimeout(collapseGroups, 600));

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="hpt-sidebar-tools">
      <span className="hpt-sidebar-tools__label">Công cụ</span>
      <a href="/admin/product-import-export" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={navLinkStyle}>
        <NavIcon>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </NavIcon>
        Import / Export sản phẩm
      </a>
      <a href="/admin/scraper" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={navLinkStyle}>
        <NavIcon><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></NavIcon>
        Cào sản phẩm
      </a>
      <a href="https://hpttech.vn" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} rel="noreferrer" style={navLinkStyle} target="_blank">
        <NavIcon>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </NavIcon>
        Xem website
        <span aria-hidden="true">↗</span>
      </a>
      <div className="hpt-sidebar-status">
        <span aria-hidden="true" />
        Hệ thống hoạt động
      </div>
    </div>
  );
}
