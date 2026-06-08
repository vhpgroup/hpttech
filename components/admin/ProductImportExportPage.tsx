"use client";

import { useRef, useState } from "react";
import { Download, FileDown, FileUp, KeyRound } from "lucide-react";

type ImportResult = {
  created: number;
  errors: Array<{ message: string; row: number; sku?: string }>;
  skipped: number;
  updated: number;
};

type ProductProfile = "all" | "scanner" | "printer" | "photocopier";

const styles = {
  button: {
    alignItems: "center",
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 13,
    fontWeight: 800,
    gap: 8,
    height: 42,
    justifyContent: "center",
    padding: "0 14px",
  } satisfies React.CSSProperties,
  card: {
    background: "#fff",
    border: "1px solid #dbe3ef",
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    padding: 22,
  } satisfies React.CSSProperties,
  input: {
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    color: "#0f172a",
    fontSize: 14,
    height: 42,
    outline: "none",
    padding: "0 12px",
    width: "100%",
  } satisfies React.CSSProperties,
};

function withSecret(url: string, secret: string) {
  if (!secret) return url;
  const nextUrl = new URL(url, window.location.origin);
  nextUrl.searchParams.set("secret", secret);
  return nextUrl.pathname + nextUrl.search;
}

export default function ProductImportExportPage() {
  const [secret, setSecret] = useState("");
  const [profile, setProfile] = useState<ProductProfile>("scanner");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const download = (type: "template" | "products") => {
    const path = type === "template"
      ? `/api/admin/products/export?type=template&profile=${profile === "all" ? "scanner" : profile}`
      : `/api/admin/products/export?profile=${profile}`;
    window.location.href = withSecret(path, secret);
  };

  const importFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chọn file CSV trước khi import.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(withSecret("/api/admin/products/import", secret), {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Import thất bại.");
      setResult(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        background: "#f6f8fb",
        color: "#0f172a",
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      <section style={{ ...styles.card, margin: "0 auto", maxWidth: 1120 }}>
        <p
          style={{
            color: "#0A4BFF",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Quản trị sản phẩm
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.3, margin: "8px 0 0" }}>
          Import / Export sản phẩm
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "10px 0 0", maxWidth: 780 }}>
          Dùng file Excel có tiêu đề tiếng Việt để xuất danh sách sản phẩm từ Payload, tải file mẫu theo từng loại máy và import cập nhật hàng loạt.
          Import sẽ ưu tiên cập nhật theo SKU, nếu không có SKU thì theo slug.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 22,
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          margin: "22px auto 0",
          maxWidth: 1120,
        }}
      >
        <aside style={styles.card}>
          <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
            <span
              style={{
                alignItems: "center",
                background: "#eff6ff",
                borderRadius: 12,
                color: "#0A4BFF",
                display: "inline-flex",
                height: 42,
                justifyContent: "center",
                width: 42,
              }}
            >
              <KeyRound size={18} />
            </span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>Mã bảo vệ</h2>
              <p style={{ color: "#64748b", fontSize: 12, margin: "3px 0 0" }}>Dùng khi production đặt secret.</p>
            </div>
          </div>
          <input
            placeholder="PRODUCT_IMPORT_EXPORT_SECRET"
            style={{ ...styles.input, marginTop: 16 }}
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
          <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, margin: "12px 0 0" }}>
            Local dev có thể để trống. Production bắt buộc đặt secret trong env để tránh import nhầm dữ liệu.
          </p>

          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 18, paddingTop: 18 }}>
            <label style={{ color: "#0f172a", display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Nhập theo loại máy
            </label>
            <select
              value={profile}
              onChange={(event) => setProfile(event.target.value as ProductProfile)}
              style={{ ...styles.input, background: "#fff" }}
            >
              <option value="scanner">Máy scan</option>
              <option value="printer">Máy in</option>
              <option value="photocopier">Photocopy</option>
              <option value="all">Tất cả sản phẩm</option>
            </select>
            <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, margin: "10px 0 0" }}>
              File mẫu sẽ chỉ hiện các cột cần nhập cho loại máy đã chọn.
            </p>
          </div>
        </aside>

        <div style={{ display: "grid", gap: 22 }}>
          <section style={styles.card}>
            <h2 style={{ fontSize: 21, fontWeight: 900, margin: 0 }}>Export</h2>
            <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0" }}>
              Tải file mẫu Excel tiếng Việt cho nhân viên nhập liệu hoặc xuất danh sách sản phẩm hiện có trong Payload theo loại máy đã chọn.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => download("template")}
                style={{ ...styles.button, background: "#fff", color: "#0f172a" }}
              >
                <FileDown size={17} />
                Tải file mẫu
              </button>
              <button
                type="button"
                onClick={() => download("products")}
                style={{ ...styles.button, background: "#0A4BFF", borderColor: "#0A4BFF", color: "#fff" }}
              >
                <Download size={17} />
                Export sản phẩm
              </button>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={{ fontSize: 21, fontWeight: 900, margin: 0 }}>Import</h2>
            <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0" }}>
              Chọn file Excel/CSV đã chỉnh sửa. Hệ thống sẽ tạo mới hoặc cập nhật sản phẩm trong Payload.
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 14,
                marginTop: 16,
                padding: 16,
              }}
            >
              <input ref={fileRef} type="file" accept=".xls,.html,.csv,text/csv,application/vnd.ms-excel" style={{ color: "#0f172a", fontSize: 13 }} />
              <button
                type="button"
                onClick={importFile}
                disabled={busy}
                style={{
                  ...styles.button,
                  background: "#0A4BFF",
                  borderColor: "#0A4BFF",
                  color: "#fff",
                  marginTop: 14,
                  opacity: busy ? 0.65 : 1,
                }}
              >
                <FileUp size={17} />
                {busy ? "Đang import..." : "Import Excel/CSV"}
              </button>
            </div>

            {error ? (
              <p
                style={{
                  background: "#fef2f2",
                  borderRadius: 12,
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 700,
                  margin: "16px 0 0",
                  padding: 12,
                }}
              >
                {error}
              </p>
            ) : null}

            {result ? (
              <div style={{ border: "1px solid #dbe3ef", borderRadius: 14, marginTop: 16, padding: 16 }}>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                  <Stat label="Tạo mới" value={result.created} />
                  <Stat label="Cập nhật" value={result.updated} />
                  <Stat label="Bỏ qua" value={result.skipped} />
                  <Stat label="Lỗi" value={result.errors.length} />
                </div>
                {result.errors.length ? (
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: 12,
                      marginTop: 14,
                      maxHeight: 210,
                      overflow: "auto",
                      padding: 12,
                    }}
                  >
                    {result.errors.slice(0, 50).map((item) => (
                      <p key={`${item.row}-${item.message}`} style={{ color: "#475569", fontSize: 12, margin: "0 0 6px" }}>
                        Dòng {item.row}{item.sku ? ` (${item.sku})` : ""}: {item.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12 }}>
      <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ color: "#0f172a", fontSize: 26, fontWeight: 900, margin: "4px 0 0" }}>{value}</p>
    </div>
  );
}
