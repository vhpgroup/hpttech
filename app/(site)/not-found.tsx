import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container py-10">
      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          404 - Không tìm thấy trang
        </h1>
        <p style={{ color: "#4b5563", marginBottom: 16 }}>
          Liên kết bạn vừa truy cập chưa được migrate sang App Router.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#0b57d0",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Quay về trang chủ
        </Link>
      </section>
    </main>
  );
}