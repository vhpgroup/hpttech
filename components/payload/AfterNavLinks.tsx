"use client";

export default function AfterNavLinks() {
  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: "auto",
        padding: "16px 0",
      }}
    >
      <a
        href="https://hpttech.vn"
        onMouseEnter={(event) => {
          event.currentTarget.style.background = "rgba(255,255,255,0.06)";
          event.currentTarget.style.color = "#c7d2fe";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = "transparent";
          event.currentTarget.style.color = "#94a3b8";
        }}
        rel="noreferrer"
        style={{
          alignItems: "center",
          borderRadius: 8,
          color: "#94a3b8",
          display: "flex",
          fontSize: 13,
          fontWeight: 600,
          gap: 8,
          padding: "8px 12px",
          textDecoration: "none",
          transition: "all 0.15s",
        }}
        target="_blank"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </svg>
        Xem website
        <span aria-hidden="true">→</span>
      </a>

      <div
        style={{
          alignItems: "center",
          color: "#4f5f8a",
          display: "flex",
          fontSize: 12,
          gap: 8,
          padding: "8px 12px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            animation: "pulse-dot 2s infinite",
            background: "#22c55e",
            borderRadius: "50%",
            boxShadow: "0 0 6px rgba(34,197,94,0.6)",
            height: 7,
            width: 7,
          }}
        />
        Hệ thống hoạt động
      </div>

      <style>
        {`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
