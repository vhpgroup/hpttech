export default function NavLogo() {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 8,
        padding: "0 4px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          display: "flex",
          flexShrink: 0,
          height: 32,
          justifyContent: "center",
          width: 32,
        }}
      >
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 0 }}>
          H
        </span>
      </div>

      <div style={{ lineHeight: 1.1 }}>
        <div
          style={{
            background: "linear-gradient(90deg, #a5b4fc, #c7d2fe)",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 0,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          HPT TECH
        </div>
        <div
          style={{
            color: "#4f5f8a",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          CMS Admin
        </div>
      </div>
    </div>
  );
}
